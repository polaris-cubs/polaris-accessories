import "@/components/sidebar/sidebar.css"; 

import Image from "next/image";
import userIcon from "@/assets/icons/User.png"; 

export default function Sidebar() {
  return (
    <div className="sidebar">
      <Image src={userIcon} alt="User Icon" className="user-icon" width={100} height={100} />
      
      <div className="sidebar-title">Dashboard</div>
      
      <nav className="nav">
        <a href="/">Home</a>
        <a href="/my-data">My Data</a>
        <a href="/our-data">Our Data</a>
        <a href="/settings">Settings</a>
        <hr />
      </nav>
    </div>
  );
}
