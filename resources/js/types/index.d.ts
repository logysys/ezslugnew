import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Effect {
    moving_effect: string;
    moving_pattern: string;
    brand_message: string;
    avatar_link: string;
    landing_page: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    template?: Template;
    themecollection?: Template[];
	effect?: Effect[];
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Template {
    id: number;
    title: string;
    image: string;
    description: string;
    user_id: number;
    framecolor: string;
    transparency: string;
    price: string;
    status: string;
    option: string; // 'autoplay' | 'mute' | etc.
    created_at: string;
    updated_at: string;
}

