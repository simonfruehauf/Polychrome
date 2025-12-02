import React, { useEffect, useState } from 'react';
import { Settings } from '../services/utils';

interface MirrorStatus {
    url: string;
    latency: number;
}

const SettingsPage: React.FC = () => {
    const [mirrors, setMirrors] = useState<MirrorStatus[]>([]);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const settings = Settings.getInstance();

    useEffect(() => {
        const handleMirrorsUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<MirrorStatus[]>;
            setMirrors(customEvent.detail);
            setIsRefreshing(false);
        };

        // Initial load
        setMirrors(settings.getSortedMirrors());

        settings.addEventListener('mirrorsUpdated', handleMirrorsUpdate as EventListener);

        return () => {
            settings.removeEventListener('mirrorsUpdated', handleMirrorsUpdate as EventListener);
        };
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await settings.refreshMirrors();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Mirror Status</h2>
                <p className="text-neutral-400 mb-4">
                    The application uses a list of mirrors to fetch content. These mirrors are sorted by latency to ensure the best performance.
                    You can manually refresh the latency check below.
                </p>
                <button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="bg-white text-black font-bold py-2 px-4 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Mirror Latency'}
                </button>

                <div className="mt-6">
                    {mirrors.length === 0 ? (
                        <p className="text-neutral-400">No mirrors available or being checked.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-700">
                                <thead className="bg-neutral-800">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Mirror URL
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Latency
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {mirrors.map((mirror, index) => (
                                        <tr key={index} className="hover:bg-neutral-800">
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                                                <a href={mirror.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    {mirror.url}
                                                </a>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-300">
                                                {mirror.latency === Infinity ? 'Failed' : `${mirror.latency.toFixed(2)}ms`}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    mirror.latency === Infinity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {mirror.latency === Infinity ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Placeholder for "Currently Used Mirror" if implemented later */}
            {/*
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Currently Used Mirror</h2>
                <p className="text-neutral-400">This feature is not yet implemented.</p>
            </div>
            */}
        </div>
    );
};

export default SettingsPage;