"use client";
import "@/components/sidebar/sidebar.css"; 
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';

import userIcon from "@/assets/User.png"; 

const subNavItems = [
    { id: 'snowplow', label: 'Snowplow' },
    { id: 'spreader', label: 'Spreader' },
    { id: 'winch', label: 'Winch' },
    { id: 'lightbar', label: 'Light Bar' },
    { id: 'audio', label: 'Audio System' }
];

export default function Sidebar() {
    const pathname = usePathname();
    const currentPath = pathname.split('/')[1] || 'home';
    
    // Convert path to title (e.g., 'my-data' -> 'My Data')
    const getPageTitle = (path: string) => {
        switch(path) {
        case 'home':
            return 'Home';
        case 'my-data':
            return 'My Data';
        case 'our-data':
            return 'Our Data';
        case 'settings':
            return 'Settings';
        default:
            return 'Dashboard';
        }
    };

    // Only show sub-navigation for My Data and Our Data pages
    const showSubNav = ['my-data'].includes(currentPath);

    return (
        <div className="sidebar">
            <Image alt="User Icon" className="user-icon" height={100} src={userIcon} width={100} />
            <div className="sidebar-title">{getPageTitle(currentPath)}</div>
            
            <nav className="nav">
                {showSubNav && subNavItems.map(item => (
                    <Link 
                        key={`sidebar-${item.id}`} 
                        className={pathname.includes(item.id) ? 'active' : ''}
                        href={`/${currentPath}/subpages/${item.id}`}
                    >
                        {item.label}
                    </Link>
                ))}
                <hr />
            </nav>
        </div>
    );
}