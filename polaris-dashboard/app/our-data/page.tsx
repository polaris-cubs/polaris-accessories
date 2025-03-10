import "@/app/our-data/our-data.css"; 
import Sidebar from "@/components/sidebar/sidebar";

export default function MyDataPage() {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="content">
        <h1>Our data Page</h1>
        <p>our-data</p>
      </div>
    </div>
  );
}
