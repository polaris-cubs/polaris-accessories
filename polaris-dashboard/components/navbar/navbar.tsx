"use client";
import "@/components/navbar/navbar.css";
import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuItem,
    NavbarItem,
} from "@heroui/navbar";
import NextLink from "next/link";
import { usePathname } from 'next/navigation';

const mainNavItems = [
    { id: 'home', path: '/', label: 'US MAP' },
    { id: 'my-data', path: '/my-data', label: 'Accessories' },
    { id: 'our-data', path: '/our-data', label: 'Our Data' },
    { id: 'settings', path: '/settings', label: 'Settings' }
];

export const Navbar = () => {
    const pathname = usePathname();

    return (
        <div className="navbar-wrapper">
            <HeroUINavbar className="navbar-container" maxWidth="xl">
                <NavbarContent className="justify-start">
                    <ul className="hidden lg:flex gap-4 ml-4">
                        {mainNavItems.map(item => (
                            <NavbarItem key={`desktop-${item.id}`}>
                                <NextLink 
                                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                                    href={item.path}
                                >
                                    {item.label}
                                </NextLink>
                            </NavbarItem>
                        ))}
                    </ul>
                </NavbarContent>

                <NavbarMenu>
                    <div className="menu-links">
                        {mainNavItems.map(item => (
                            <NavbarMenuItem key={`mobile-${item.id}`}>
                                <NextLink 
                                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                                    href={item.path}
                                >
                                    {item.label}
                                </NextLink>
                            </NavbarMenuItem>
                        ))}
                    </div>
                </NavbarMenu>
            </HeroUINavbar>
        </div>
    );
};