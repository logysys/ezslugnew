import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { 
    faCreditCard,
    faInfoCircle,
    faTrashAlt,
    faTimes,
    faCheckCircle,
    faExclamationTriangle,
    faSpinner,
    faPaperPlane,
    faHistory,
    faReceipt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Template = {
    id: number;
    user_id: number;
    image: string;
    option?: string;
};

type TokenInfo = {
    token_name: string;
    total_supply: number;
    circulating_supply: number;
    current_price: number;
    last_updated: string;
};

export default function SendBee() {
    const { auth, template, tokenInfo } = usePage<SharedData>().props;
    const [points, setPoints] = useState(1);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [availablePoints, setAvailablePoints] = useState(0);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [transferHistory, setTransferHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(true); // Changed to true to show history on page load

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await axios.get('/buy-bee/balance');
                setAvailablePoints(Number(response.data.balance) || 0);
            } catch (error) {
                console.error('Failed to fetch balance:', error);
                setAvailablePoints(0);
                if (axios.isAxiosError(error)) {
                    setErrorMessage(error.response?.data?.message || 'Failed to fetch balance');
                } else {
                    setErrorMessage('Failed to fetch balance');
                }
            }
        };

        const fetchTransferHistory = async () => {
            try {
                const response = await axios.get('/transfer-history');
                setTransferHistory(response.data.transfers || []);
            } catch (error) {
                console.error('Failed to fetch transfer history:', error);
            }
        };

        fetchBalance();
        fetchTransferHistory();
    }, []);

    const handleIncrement = () => {
        const newPoints = points + 1;
        setPoints(newPoints);
    };

    const handleDecrement = () => {
        if (points > 1) {
            const newPoints = points - 1;
            setPoints(newPoints);
        }
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            const numValue = value === '' ? 0 : parseInt(value, 10);
            setPoints(numValue);
        }
    };

    const handlePointsBlur = () => {
        if (points < 1) {
            setPoints(1);
        }
    };

    const handleSendPoints = async () => {
        if (!recipientEmail) {
            setErrorMessage('Please enter recipient email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        if (points > availablePoints) {
            setErrorMessage('You do not have enough EZ$ to send');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await axios.post('/send-bee', {
                points: points,
                recipient_email: recipientEmail,
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json',
                }
            });

            setSuccessMessage(`Successfully sent EZ$${points.toFixed(2)} to ${recipientEmail}`);
            setAvailablePoints(prev => prev - points);
            setRecipientEmail('');
            setPoints(1);
            
            // Refresh balance and history
            const balanceResponse = await axios.get('/buy-bee/balance');
            setAvailablePoints(Number(balanceResponse.data.balance) || 0);
            
            const historyResponse = await axios.get('/transfer-history');
            setTransferHistory(historyResponse.data.transfers || []);
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.response?.data?.error || 'Failed to send EZ$');
            } else {
                setErrorMessage('Failed to send EZ$. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setPoints(1);
        setRecipientEmail('');
        setErrorMessage('');
        setSuccessMessage('Form cleared successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <>
            <Head>
                <title>Send Bee Points - EZ3D</title>
                <meta name="description" content="Send Bee Points to other users" />
            </Head>
            <Tooltip id="sendbee-tooltip" />
            <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>
            <DraggableMenu auth={auth} />
            
            <main className="relative flex justify-center items-center min-h-screen p-4 overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-6 rounded-xl border border-white-700 overflow-y-auto shadow-2xl max-w-6xl w-full">
                        <h1 
                            className="text-2xl md:text-3xl font-bold text-center text-yellow-400 mb-6"
                            data-tooltip-id="sendbee-tooltip"
                            data-tooltip-content="Send EZ$ to other users on the platform."
                        >
                            Send EZ$ to Other Users
                        </h1>

                        {errorMessage && (
                            <div className="bg-red-500/90 text-white p-3 mb-4 rounded-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/90 text-white p-3 mb-4 rounded-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                {successMessage}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Send Form */}
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6 lg:col-span-2">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-yellow-400 mb-2">Recipient Email</label>
                                        <input 
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            className="w-full p-3 bg-white text-gray-800 rounded-md border-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            placeholder="Enter recipient's email"
                                            data-tooltip-id="sendbee-tooltip"
                                            data-tooltip-content="The email address of the user you want to send EZ$ to"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-yellow-400 mb-2">EZ$ Amount</label>
                                        <div className="flex items-center">
                                            <button 
                                                className="bg-green-600 text-white font-bold text-xl px-4 py-2 rounded-l-md hover:bg-green-700 transition-colors focus:outline-none"
                                                onClick={handleDecrement}
                                                data-tooltip-id="sendbee-tooltip"
                                                data-tooltip-content="Decrease the number of points to send"
                                            >
                                                -
                                            </button>
                                            <input 
                                                type="text" 
                                                inputMode="numeric"
                                                value={points === 0 ? '' : points}
                                                onChange={handlePointsChange}
                                                onBlur={handlePointsBlur}
                                                className="w-full bg-white text-gray-800 text-center font-bold text-lg py-2.5 border-none focus:outline-none"
                                                data-tooltip-id="sendbee-tooltip"
                                                data-tooltip-content="The number of points you wish to send"
                                            />
                                            <button 
                                                className="bg-green-600 text-white font-bold text-xl px-4 py-2 rounded-r-md hover:bg-green-700 transition-colors focus:outline-none"
                                                onClick={handleIncrement}
                                                data-tooltip-id="sendbee-tooltip"
                                                data-tooltip-content="Increase the number of points to send"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-center items-center gap-4 pt-4">
                                    <button 
                                        onClick={handleClear}
                                        className="bg-red-600/90 text-white font-bold py-2.5 px-6 md:px-8 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                                        data-tooltip-id="sendbee-tooltip"
                                        data-tooltip-content="Clear the form"
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                        <span>Clear</span>
                                    </button>
                                    <button 
                                        onClick={handleSendPoints}
                                        disabled={isLoading || points < 1 || !recipientEmail}
                                        className="bg-yellow-400 text-black font-bold py-2.5 px-6 md:px-8 rounded-md flex items-center gap-3 hover:bg-yellow-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        data-tooltip-id="sendbee-tooltip"
                                        data-tooltip-content="Send EZ$ to the recipient"
                                    >
                                        {isLoading ? (
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        ) : (
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        )}
                                        <span>{isLoading ? 'Sending...' : 'Send EZ$'}</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="bg-purple-600/90 text-white font-bold py-2.5 px-6 md:px-8 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                                        data-tooltip-id="sendbee-tooltip"
                                        data-tooltip-content="View transfer history"
                                    >
                                        <FontAwesomeIcon icon={faHistory} />
                                        <span>History</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right Column - Balance Info */}
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                <div 
                                    className="bg-purple-800/80 text-white p-4 rounded-lg text-center border border-purple-600"
                                    data-tooltip-id="sendbee-tooltip"
                                    data-tooltip-content="This is your current balance of EZ$."
                                >
                                    <div className="text-sm text-purple-300 flex items-center justify-center gap-2">
                                        <span>AVAILABLE EZ$</span>
                                        <FontAwesomeIcon 
                                            icon={faInfoCircle} 
                                            className="text-purple-300"
                                            data-tooltip-id="sendbee-tooltip"
                                            data-tooltip-content="Your current point balance"
                                        />
                                    </div>
                                    <div className="text-3xl font-bold mt-1">EZ${availablePoints.toFixed(2)}</div>
                                </div>

                                <div 
                                    className="text-center bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-600"
                                    data-tooltip-id="sendbee-tooltip"
                                    data-tooltip-content="EZ$ can be used to unlock powerful tools and features."
                                >
                                    <h3 className="text-yellow-400 font-semibold mb-3 text-lg">Points Benefits:</h3>
                                    <ul className="text-gray-300 text-sm space-y-2 text-left">
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Create unlimited tags and widgets</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Access premium features</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Enhance your marketing tools</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Boost engagement and conversions</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        {/* Transfer History Section - Now visible by default */}
                        {showHistory && (
                            <div className="mt-6 bg-gray-800/80 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faHistory} />
                                    Transfer History
                                </h3>
                                {transferHistory.length === 0 ? (
                                    <p className="text-gray-300 text-center py-4">No transfer history found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-gray-300">
                                            <thead className="text-left bg-gray-700/50">
                                                <tr>
                                                    <th className="p-3">Date</th>
                                                    <th className="p-3">Type</th>
                                                    <th className="p-3">Amount</th>
                                                    <th className="p-3">Recipient/Sender</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3">Invoice #</th>
                                                    <th className="p-3">Transaction Hash</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transferHistory.map((transfer, index) => (
                                                    <tr key={index} className="border-b border-gray-700">
                                                        <td className="p-3">{new Date(transfer.created_at).toLocaleDateString()}</td>
                                                        <td className="p-3">{transfer.sender_id === auth.user.id ? 'Sent' : 'Received'}</td>
                                                        <td className="p-3">EZ${transfer.amount}</td>
                                                        <td className="p-3">
                                                            {transfer.sender_id === auth.user.id 
                                                                ? transfer.receiver?.email 
                                                                : transfer.sender?.email
                                                            }
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                transfer.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                                                transfer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-red-500/20 text-red-300'
                                                            }`}>
                                                                {transfer.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            {transfer.invoice_number ? (
                                                                <a 
                                                                    href={`/invoicesendbee/${transfer.invoice_number}`}
                                                                    className="text-yellow-400 hover:text-yellow-300 underline flex items-center gap-1"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <FontAwesomeIcon icon={faReceipt} className="text-sm" />
                                                                    {transfer.invoice_number}
                                                                </a>
                                                            ) : (
                                                                'N/A'
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-mono text-xs">{transfer.transaction_hash}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!isPanelVisible && (
                    <button 
                        onClick={() => setIsPanelVisible(true)}
                        className="fixed bottom-4 right-4 bg-yellow-400 text-black font-bold py-3 px-4 rounded-full hover:bg-yellow-500 transition-colors z-50 flex items-center gap-2"
                        data-tooltip-id="sendbee-tooltip"
                        data-tooltip-content="Show send panel"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        <span>Send EZ$</span>
                    </button>
                )}
            </main>
        </>
    );
}