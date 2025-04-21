"use client";
import "@/components/sidebar/sidebar.css"; 
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';

import userIcon from "@/assets/User.png"; 

const accessoriesSubNavItems = [
    { id: 'snowplow', label: 'Snowplow' },
    { id: 'spreader', label: 'Spreader' },
    { id: 'winch', label: 'Winch' },
    { id: 'lightbar', label: 'Light Bar' },
    { id: 'audio', label: 'Audio System' },
    { id: 'accessory-comparison', label: 'Comparison' }
];

const stateSubNavItems = [
    { id: 'Wisconsin', label: 'Wisconsin' },
    { id: 'Minnesota', label: 'Minnesota' },
    { id: 'Illinois', label: 'Illinois' },
    { id: 'Indiana', label: 'Indiana' },
    { id: 'Michigan', label: 'Michigan' },
    { id: 'comparison', label: 'State Comparison' }
];

export default function Sidebar() {
    const pathname = usePathname();
    const currentPath = pathname.split('/')[1] || 'state';
    
    const getPageTitle = (path: string) => {
        switch(path) {
        case '':
        case 'state':
            return 'US MAP';
        case 'my-data':
            return 'Accessories';
        case 'our-data':
            return 'Our Data';
        case 'settings':
            return 'Settings';
        default:
            return 'US MAP';
        }
    };

    const renderSubNav = () => {
        switch(currentPath) {
        case 'state':
            return stateSubNavItems.map(item => (
                <Link 
                    key={`state-${item.id}`} 
                    className={pathname.includes(item.id) ? 'active' : ''}
                    href={item.id === 'comparison' ? `/state/${item.id}` : `/state/${item.id}/details`}
                >
                    {item.label}
                </Link>
            ));
        case 'my-data':
            return accessoriesSubNavItems.map(item => (
                <Link 
                    key={`my-data-${item.id}`} 
                    className={pathname.includes(item.id) ? 'active' : ''}
                    href={`/my-data/subpages/${item.id}`}
                >
                    {item.label}
                </Link>
            ));
        case 'our-data':
            return null;
        default:
            return stateSubNavItems.map(item => (
                <Link 
                    key={`state-${item.id}`} 
                    className={pathname.includes(item.id) ? 'active' : ''}
                    href={`/state/${item.id}/details`}
                >
                    {item.label}
                </Link>
            ));
        }
    };

    return (
        <div className="sidebar">
            <Image alt="User Icon" className="user-icon" height={100} src={userIcon} width={100} />
            <div className="sidebar-title">{getPageTitle(currentPath)}</div>
            
            <nav className="nav">
                {renderSubNav()}
            </nav>
        </div>
    );
} 