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

const stateNavItems = [
    { id: 'Wisconsin', label: 'Wisconsin', href: '/state/Wisconsin/details' },
    { id: 'Indiana', label: 'Indiana', href: '/state/Indiana/details' },
    { id: 'Minnesota', label: 'Minnesota', href: '/state/Minnesota/details' },
    { id: 'Michigan', label: 'Michigan', href: '/state/Michigan/details' },
    { id: 'Illinois', label: 'Illinois', href: '/state/Illinois/details' }
];

export default function Sidebar() {
    const pathname = usePathname();
    const currentPath = pathname.split('/')[1] || 'home';
    const isStateDetails = pathname.includes('/state/') && pathname.includes('/details');
    
    // Convert path to title (e.g., 'my-data' -> 'My Data')
    const getPageTitle = (path: string) => {
        if (isStateDetails) {
            return 'US Map';
        }
        switch(path) {
        case 'home':
            return 'US Map';
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

    // Show sub-navigation for My Data and US Map pages
    const showSubNav = currentPath === 'my-data';
    const showStateNav = currentPath === 'home' || isStateDetails;

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
                {showStateNav && stateNavItems.map(item => (
                    <Link 
                        key={`sidebar-${item.id}`} 
                        className={pathname.includes(item.id.toLowerCase()) ? 'active' : ''}
                        href={item.href}
                    >
                        {item.label}
                    </Link>
                ))}
                <hr />
            </nav>
        </div>
    );
}