import USDrillDownMap from './USDrillDownMap';

export default function Dashboard() {
    return (
        <div className="dashboard-container">
            <div className="main-content justify-end">
                <div className="map-section mr-8">
                    <USDrillDownMap />
                </div>
            </div>
        </div>
    );
} 