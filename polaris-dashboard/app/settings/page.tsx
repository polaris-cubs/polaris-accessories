import "@/app/settings/settings.css"; 
import Sidebar from "@/components/sidebar/sidebar";

export default function MyDataPage() {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="content">
        <h1>Settings Page</h1>
        <p>settings</p>
      </div>
    </div>
  );
}
