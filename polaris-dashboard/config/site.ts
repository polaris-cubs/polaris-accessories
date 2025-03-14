export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "Polaris Dashboard",
    description: "Dashboard for polaris vehicle and accessories",
    navItems: [
        {
            label: "Home",
            href: "/",
        },
    ],
    navMenuItems: [
        {
            label: "Profile",
            href: "/profile",
        },
        {
            label: "Settings",
            href: "/settings",
        },
        {
            label: "Logout",
            href: "/logout",
        },
    ],
    links: {
        github: "https://github.com/",
        twitter: "https://twitter.com/hero_ui",
        docs: "https://heroui.com",
        discord: "https://discord.gg/9b6yyZKmH4",
        sponsor: "https://patreon.com/jrgarciadev",
    },
};
