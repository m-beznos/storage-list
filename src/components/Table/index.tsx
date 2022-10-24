import React, { useEffect, useMemo } from "react";
import {
  ReactGrid,
  Column,
  Row,
  CellChange,
  SelectionMode,
  Id,
  MenuOption,
} from "@silevis/reactgrid";
import classNames from "classnames";
import moment, { Moment } from "moment";

interface ProductStringAttributes {
  name: string;
  producer: string;
  buy: string;
  createdAt: string;
}

interface ProductNumberAttributes {
  sold: number;
  rest: number;
}

interface ProductBooleanAttributes {
  isDeleted: boolean;
}

interface Product {
  id: number;
  attributes: ProductStringAttributes &
    ProductNumberAttributes &
    ProductBooleanAttributes;
}

const getColumns = (): Column[] => [
  { columnId: "name", width: 350 },
  { columnId: "producer" },
  { columnId: "sold" },
  { columnId: "rest" },
  { columnId: "buy" },
  { columnId: "createdAt" },
];

const headerRow: Row = {
  rowId: "header",
  cells: [
    { type: "header", text: "Name" },
    { type: "header", text: "Producer" },
    { type: "header", text: "Sold" },
    { type: "header", text: "Rest" },
    { type: "header", text: "Buy" },
    { type: "header", text: "Created at" },
  ],
};

const getRows = (products: Product[], showDeleted: boolean): Row[] =>
  products.reduce(
    (rows, product) => {
      if (showDeleted || !product.attributes.isDeleted) {
        const rowClassName = classNames({
          deletedRow: product.attributes.isDeleted,
        });
        rows.push({
          rowId: product.id,
          cells: [
            {
              type: "text",
              text: product.attributes.name,
              nonEditable: true,
              className: rowClassName,
            },
            {
              type: "text",
              text: product.attributes.producer,
              nonEditable: true,
              className: rowClassName,
            },
            {
              type: "number",
              value: product.attributes.sold,
              className: rowClassName,
            },
            {
              type: "number",
              value: product.attributes.rest,
              nonEditable: true,
              className: rowClassName,
            },
            {
              type: "text",
              text: product.attributes.buy || "",
              className: rowClassName,
            },
            {
              type: "text",
              text: moment(product.attributes.createdAt).format("YYYY-MM-DD"),
              nonEditable: true,
              className: rowClassName,
            },
          ],
        });
      }
      return rows;
    },
    [headerRow]
  );

const applyChangesToProducts = (
  changes: CellChange[],
  prevProducts: Product[]
): Product[] => {
  changes.forEach((change) => {
    const productId = change.rowId;

    if (change.newCell.type === "text") {
      const fieldName = change.columnId as keyof ProductStringAttributes;
      const product = prevProducts.find((product) => product.id === productId);

      if (!product) return;

      product.attributes[fieldName] = change.newCell.text;

      fetch(`${process.env.REACT_APP_API_URL}/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer abbe3d628da7eaaaf6b16debd7b6fe1f4da25f40d13bcca7191952bb7a0ec1c2a0fb6bf267143dd16fce921f146df8eb30dc5f2681f385984f5bd38aa748dd89a63ca620bee88c077ea61e11607166bfba1ab45d739edc3552c33c2e91d40e80fe7f5221f29c0cd4d269beb5c80f2f17d59b1be4eebc9476f7fc005ff5739722`,
        },
        body: JSON.stringify({
          data: {
            [fieldName]: change.newCell.text,
          },
        }),
      });
    } else if (change.newCell.type === "number") {
      const fieldName = change.columnId as keyof ProductNumberAttributes;
      const product = prevProducts.find((product) => product.id === productId);

      if (!product) return;

      product.attributes[fieldName] = change.newCell.value;

      fetch(`${process.env.REACT_APP_API_URL}/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer abbe3d628da7eaaaf6b16debd7b6fe1f4da25f40d13bcca7191952bb7a0ec1c2a0fb6bf267143dd16fce921f146df8eb30dc5f2681f385984f5bd38aa748dd89a63ca620bee88c077ea61e11607166bfba1ab45d739edc3552c33c2e91d40e80fe7f5221f29c0cd4d269beb5c80f2f17d59b1be4eebc9476f7fc005ff5739722`,
        },
        body: JSON.stringify({
          data: {
            [fieldName]: change.newCell.value,
          },
        }),
      });
    }
  });
  return [...prevProducts];
};

const _debounce = function <T extends (...args: any[]) => void>(
  callback: T,
  debounceDelay: number = 300,
  immediate: boolean = false
) {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function <U>(this: U, ...args: Parameters<typeof callback>) {
    const context = this;

    if (immediate && !timeout) {
      callback.apply(context, args);
    }
    if (typeof timeout === "number") {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) {
        callback.apply(context, args);
      }
    }, debounceDelay);
  };
};

const Table = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [filters, setFilters] = React.useState<{
    dateFrom?: Moment | null;
    dateTo?: Moment | null;
    query?: string | null;
  }>({});

  const debouncedSetFilters = _debounce(setFilters);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/products`)
      .then((res) => res.json())
      .then((json) => {
        setProducts(json.data);
      });
  }, []);

  const rows = useMemo(() => {
    let filteredProducts = products;

    if (filters.query) {
      const q = filters.query;
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.attributes.name.includes(q) ||
          product.attributes.producer.includes(q)
      );
    }

    if (filters.dateFrom?.isValid || filters.dateTo?.isValid) {
      if (!filters.dateTo?.isValid) {
        const dateFrom = moment(filters.dateFrom).add(-1, "day");
        filteredProducts = filteredProducts.filter((product) =>
          moment(product.attributes.createdAt).isAfter(dateFrom, "day")
        );
      } else if (!filters.dateFrom?.isValid) {
        const dateTo = moment(filters.dateTo).add(1, "day");
        filteredProducts = filteredProducts.filter((product) =>
          moment(product.attributes.createdAt).isBefore(dateTo, "day")
        );
      } else {
        if (filters.dateFrom.isAfter(filters.dateTo)) {
          return [];
        }

        filteredProducts = filteredProducts.filter((product) =>
          moment(product.attributes.createdAt).isBetween(
            filters.dateFrom,
            filters.dateTo,
            "day",
            "[]"
          )
        );
      }
    }

    return getRows(filteredProducts, showDeleted);
  }, [products, showDeleted, filters]);

  const columns = getColumns();

  const handleChanges = (changes: CellChange[]) => {
    setProducts((prevProducts) =>
      applyChangesToProducts(changes, prevProducts)
    );
  };

  const handleContextMenu = (
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[]
  ): MenuOption[] => {
    if (selectionMode === "row") {
      return [
        {
          id: "1",
          label:
            selectedRowIds.length > 1 ? "Delete products" : "Delete product",
          handler: (selectedRowIds: Id[]) => {
            for (let id of selectedRowIds) {
              setProducts((prevProducts) => {
                const deletedProductIndex = prevProducts.findIndex(
                  (product) => product.id === id
                );
                if (prevProducts[deletedProductIndex]) {
                  prevProducts[deletedProductIndex].attributes.isDeleted = true;
                }
                return [...prevProducts];
              });
              fetch(`${process.env.REACT_APP_API_URL}/products/${id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `bearer abbe3d628da7eaaaf6b16debd7b6fe1f4da25f40d13bcca7191952bb7a0ec1c2a0fb6bf267143dd16fce921f146df8eb30dc5f2681f385984f5bd38aa748dd89a63ca620bee88c077ea61e11607166bfba1ab45d739edc3552c33c2e91d40e80fe7f5221f29c0cd4d269beb5c80f2f17d59b1be4eebc9476f7fc005ff5739722`,
                },
                body: JSON.stringify({
                  data: {
                    isDeleted: true,
                  },
                }),
              });
            }
          },
        },
        {
          id: "2",
          label:
            selectedRowIds.length > 1
              ? "Undelete products"
              : "Undelete product",
          handler: (selectedRowIds: Id[]) => {
            for (let id of selectedRowIds) {
              setProducts((prevProducts) => {
                const deletedProductIndex = prevProducts.findIndex(
                  (product) => product.id === id
                );
                if (prevProducts[deletedProductIndex]) {
                  prevProducts[deletedProductIndex].attributes.isDeleted =
                    false;
                }
                return [...prevProducts];
              });
              fetch(`${process.env.REACT_APP_API_URL}/products/${id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `bearer abbe3d628da7eaaaf6b16debd7b6fe1f4da25f40d13bcca7191952bb7a0ec1c2a0fb6bf267143dd16fce921f146df8eb30dc5f2681f385984f5bd38aa748dd89a63ca620bee88c077ea61e11607166bfba1ab45d739edc3552c33c2e91d40e80fe7f5221f29c0cd4d269beb5c80f2f17d59b1be4eebc9476f7fc005ff5739722`,
                },
                body: JSON.stringify({
                  data: {
                    isDeleted: false,
                  },
                }),
              });
            }
          },
        },
      ];
    }

    return menuOptions;
  };

  return (
    <div>
      <div>
        <label className="block mb-4">
          <div className="inline-block w-24">Search:</div>
          <input
            className="border rounded px-2"
            type="text"
            onChange={(e) => {
              const { value } = e.target;
              debouncedSetFilters((prevFilters) => ({
                ...prevFilters,
                query: value || null,
              }));
            }}
          />
        </label>

        <label className="block mb-1">
          <div className="inline-block w-24">Date from:</div>
          <input
            className="border rounded px-2"
            type="text"
            onChange={(e) => {
              const { value } = e.target;
              const date = moment(value, "YYYY-M-D", true);
              debouncedSetFilters((prevFilters) => ({
                ...prevFilters,
                dateFrom: date.isValid() ? date : null,
              }));
            }}
          />
        </label>

        <label className="block mb-4">
          <div className="inline-block w-24">Date to:</div>
          <input
            className="border rounded px-2"
            type="text"
            onChange={(e) => {
              const { value } = e.target;
              const date = moment(value, "YYYY-M-D", true);
              debouncedSetFilters((prevFilters) => ({
                ...prevFilters,
                dateTo: date.isValid() ? date : null,
              }));
            }}
          />
        </label>
      </div>
      <label className="block mb-4 flex gap-2">
        Show deleted
        <input
          type="checkbox"
          onChange={(e) => setShowDeleted(e.target.checked)}
        />
      </label>
      {rows.length && (
        <ReactGrid
          rows={rows}
          columns={columns}
          onCellsChanged={handleChanges}
          enableRowSelection
          onContextMenu={handleContextMenu}
          stickyTopRows={1}
        />
      )}
    </div>
  );
};

export default Table;
