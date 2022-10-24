import "@silevis/reactgrid/styles.css";
import "./App.css";
import Navbar from "./components/Navbar";
import Table from "./components/Table";

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="container m-auto py-8 px-4">
        <Table />
      </div>
    </div>
  );
}
