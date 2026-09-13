import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img 
            {...props}
            src="/ezlogo.png"  // Path to your GIF image
            alt="ez.wiki Logo"
        />
    );
}
