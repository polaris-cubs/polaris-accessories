import "@/components/navbar/navbar.css"; 

import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarBrand,
    NavbarItem,
    NavbarMenuItem,
} from "@heroui/navbar";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, SearchIcon } from "@/components/icons";

export const Navbar = () => {
    /*
    const searchInput = (
        <Input
            aria-label="Search"
            classNames={{
                inputWrapper: "bg-default-100",
                input: "text-sm",
            }}
            endContent={
                <Kbd className="hidden lg:inline-block" keys={["command"]}>
                    K
                </Kbd>
            }
            labelPlacement="outside"
            placeholder="Search..."
            startContent={<SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />}
            type="search"
        />
    );
*/
    return (
        <HeroUINavbar maxWidth="xl" className="navbar-container"> 
            <NavbarContent className="justify-start">
                <ul className="hidden lg:flex gap-4 ml-4">
                    <NavbarItem>
                        <NextLink href="/" className="nav-link">Home</NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink href="/my-data" className="nav-link">My Data</NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink href="/our-data" className="nav-link">Our Data</NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink href="/settings" className="nav-link">Settings</NextLink>
                    </NavbarItem>
                </ul>
            </NavbarContent>



            <NavbarMenu>
                <div className="menu-links">
                    <NavbarMenuItem>
                        <NextLink href="/" className="nav-link">Home</NextLink>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <NextLink href="/my-data" className="nav-link">My Data</NextLink>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <NextLink href="/our-data" className="nav-link">Our Data</NextLink>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <NextLink href="/settings" className="nav-link">Settings</NextLink>
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};
