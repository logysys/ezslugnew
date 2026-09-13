import React from 'react';
import { Head } from '@inertiajs/react';

export default function WikiPage({ wikiPage, htmlContent }) {
    return (
        <>
            <Head title={wikiPage.title || 'Wiki Page'} />
            
            <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="wiki-page-container"
            />
        </>
    );
}