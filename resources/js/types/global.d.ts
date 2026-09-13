// global.d.ts
import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src: string;
                    alt?: string;
                    ar?: boolean;
                    'auto-rotate'?: boolean;
                    'camera-controls'?: boolean;
                    'shadow-intensity'?: string;
                    exposure?: string;
                    'environment-image'?: string;
                },
                HTMLElement
            >;
        }
    }
}