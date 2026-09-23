import { useEffect, useState } from "react";

import DashboardHeader from "../../components/dean/DashboardHeader";
import { getDeanDashboard } from "../../services/deanApi";

import StatsCards from "../../components/dean/StatsCards";
import RecentActivity from "../../components/dean/RecentActivity";
import QuickActions from "../../components/dean/QuickActions";
import CollegeOverview from "../../components/dean/CollegeOverview";
import SystemStatus from "../../components/dean/SystemStatus";

export default function Dashboard() {

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);


    // =====================================================
    // Load Dashboard
    // =====================================================

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                setLoading(true);

                const data = await getDeanDashboard();

                setDashboard(data);

            } catch (error) {

                console.error(
                    "Failed to load Dean dashboard:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        loadDashboard();

    }, []);


    // =====================================================
    // Loading State
    // =====================================================

    if (loading) {

        return (
            <div className="flex h-96 items-center justify-center">

                <div className="text-gray-500">
                    Loading dashboard...
                </div>

            </div>
        );

    }


    // =====================================================
    // Safety Check
    // =====================================================

    if (!dashboard) {

        return (
            <div className="flex h-96 items-center justify-center">

                <div className="text-red-500">
                    Failed to load dashboard.
                </div>

            </div>
        );

    }


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="space-y-8 p-6">

            {/* Header */}

            <DashboardHeader />


            {/* Statistics */}

            <StatsCards
                stats={dashboard?.overall_stats}
            />


            {/* Dashboard Content */}

            <div className="grid gap-6 xl:grid-cols-2">

                <RecentActivity
                    activities={dashboard?.recent_activity}
                />

                <QuickActions />

                <CollegeOverview
                    stats={dashboard?.overall_stats}
                />

                <SystemStatus />

            </div>

        </div>

    );

}