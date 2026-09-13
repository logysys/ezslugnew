import { Head, Link } from '@inertiajs/react';

export default function ErrorPage({ status }) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
    }[status];

    const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
    }[status] || 'An unexpected error has occurred.'; // Default message

    return (
        <div className="flex items-center justify-center min-h-screen p-5 text-gray-800 bg-gray-100">
            <Head>
                <title>{title}</title>
            </Head>
            <div className="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-indigo-600 md:text-6xl">{status}</h1>
                <p className="text-xl font-medium text-gray-600">{title}</p>
                <p className="text-gray-500">{description}</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2 mt-4 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}