import {
    CheckCircle2,
    Database,
    ShieldCheck,
    Bot,
    Mail,
} from "lucide-react";

const services = [
    {
        title: "Backend API",
        status: "Online",
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-100",
    },
    {
        title: "Database",
        status: "Connected",
        icon: Database,
        color: "text-blue-600",
        bg: "bg-blue-100",
    },
    {
        title: "Authentication",
        status: "Secure",
        icon: ShieldCheck,
        color: "text-purple-600",
        bg: "bg-purple-100",
    },
    {
        title: "AI Service",
        status: "Available",
        icon: Bot,
        color: "text-orange-600",
        bg: "bg-orange-100",
    },
    {
        title: "Email Service",
        status: "Ready",
        icon: Mail,
        color: "text-pink-600",
        bg: "bg-pink-100",
    },
];

export default function SystemStatus() {
    return (
        <div className="bg-white rounded-2xl shadow-md p-6">

            <div className="flex justify-between items-center mb-8">

                <h2 className="text-xl font-bold">
                    System Status
                </h2>

                <span className="text-sm text-green-600 font-medium">
                    All Systems Operational
                </span>

            </div>

            <div className="space-y-5">

                {services.map((service) => {

                    const Icon = service.icon;

                    return (

                        <div
                            key={service.title}
                            className="flex justify-between items-center border rounded-xl p-4 hover:shadow-md transition"
                        >

                            <div className="flex items-center gap-4">

                                <div
                                    className={`${service.bg} w-12 h-12 rounded-xl flex items-center justify-center`}
                                >

                                    <Icon
                                        className={service.color}
                                        size={22}
                                    />

                                </div>

                                <div>

                                    <h3 className="font-semibold">

                                        {service.title}

                                    </h3>

                                    <p className="text-sm text-gray-500">

                                        {service.status}

                                    </p>

                                </div>

                            </div>

                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>

                        </div>

                    );

                })}

            </div>

        </div>
    );
}