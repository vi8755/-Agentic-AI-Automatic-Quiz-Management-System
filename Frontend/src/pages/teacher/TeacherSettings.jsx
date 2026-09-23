import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {   FaUserCircle,
    FaEye,
    FaEyeSlash,} from "react-icons/fa";
import {
    getTeacherProfile,
    updateTeacherProfile,
    changeTeacherPassword,
} from "../../api/teacherApi";

const TeacherSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        employee_id: "",
        department: "",
        designation: "",
        phone: "",
    });
    const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getTeacherProfile();

            setForm({
                name: data.name || "",
                email: data.email || "",
                employee_id: data.employee_id || "",
                department: data.department || "",
                designation: data.designation || "",
                phone: data.phone || "",
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };
    const handlePasswordChange = (e) => {
    setPasswordForm({
        ...passwordForm,
        [e.target.name]: e.target.value,
    });
};

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);

        try {
            await updateTeacherProfile({
                name: form.name,
                department: form.department,
                designation: form.designation,
                phone: form.phone,
            });
            await loadProfile();


            toast.success("Profile updated successfully.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };
    const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
        passwordForm.new_password !==
        passwordForm.confirm_password
    ) {
        toast.error("Passwords do not match.");
        return;
    }

    try {
        await changeTeacherPassword({
            current_password:
                passwordForm.current_password,
            new_password:
                passwordForm.new_password,
        });

        toast.success("Password changed successfully.");

        setPasswordForm({
            current_password: "",
            new_password: "",
            confirm_password: "",
        });
    } catch (error) {
        toast.error(
            error.response?.data?.detail ||
            "Failed to change password."
        );
    }
};

    if (loading) {
        return (
            <div className="text-center py-20">
                Loading Profile...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">

        
        <div className="flex items-center gap-5 mb-8">

    <FaUserCircle
        className="text-red-600"
        size={70}
    />

    <div>

        <h1 className="text-4xl font-bold">
            Teacher Settings
        </h1>

        <p className="text-gray-500 mt-2">
            Manage your personal and professional information.
        </p>

    </div>
    </div>



            <form
                onSubmit={handleSubmit}
                className="
bg-white
rounded-2xl
shadow-lg
hover:shadow-xl
transition-all
duration-300
p-8
space-y-8
"
            
            >

                <div>

                    <h2 className="text-xl font-semibold mb-6">
                        Personal Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">

                        <div>

                            <label className="block mb-2 font-medium">
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full border rounded-xl p-3"
                            />

                        </div>

                        <div>

                            <label className="block mb-2 font-medium">
                                Email
                            </label>

                            <input
                                value={form.email}
                                disabled
                                className="w-full border rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />

                        </div>

                    </div>

                </div>

                <hr />

                <div>

                    <h2 className="text-xl font-semibold mb-6">
                        Professional Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">

                        <div>

                            <label className="block mb-2 font-medium">
                                Employee ID
                            </label>

                            <input
                                value={form.employee_id}
                                disabled
                                className="w-full border rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />

                        </div>

                        <div>

                            <label className="block mb-2 font-medium">
                                Department
                            </label>

                            <input
                                type="text"
                                name="department"
                                value={form.department}
                                onChange={handleChange}
                                className="w-full border rounded-xl p-3"
                            />

                        </div>

                        <div>

                            <label className="block mb-2 font-medium">
                                Designation
                            </label>

                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                className="w-full border rounded-xl p-3"
                            />

                        </div>

                        <div>

                            <label className="block mb-2 font-medium">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full border rounded-xl p-3"
                            />

                        </div>

                    </div>

                </div>

                <div className="flex justify-end">

                    <button
                        type="submit"
                        disabled={saving}
                        className="
bg-red-600
hover:bg-red-700
text-white
font-semibold
px-8
py-3
rounded-xl
shadow-lg
hover:shadow-xl
transition-all
duration-300
"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                </div>

            </form>
            <form
    onSubmit={handlePasswordSubmit}
    className="
bg-white
rounded-2xl
shadow-lg
p-8
mt-8
space-y-6
"
>
    <h2 className="text-xl font-semibold">
    Change Password
</h2>
 <div className="relative">
    <input
        type={showCurrentPassword ? "text" : "password"}
        name="current_password"
        value={passwordForm.current_password}
        onChange={handlePasswordChange}
        placeholder="Current Password"
        className="w-full border rounded-xl p-3 pr-12"
    />

    <button
        type="button"
        onClick={() =>
            setShowCurrentPassword(!showCurrentPassword)
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
        {showCurrentPassword ? (
            <FaEyeSlash size={20} />
        ) : (
            <FaEye size={20} />
        )}
    </button>
</div>
 <div className="relative">
    <input
        type={showNewPassword ? "text" : "password"}
        name="new_password"
        value={passwordForm.new_password}
        onChange={handlePasswordChange}
        placeholder="New Password"
        className="w-full border rounded-xl p-3 pr-12"
    />

    <button
        type="button"
        onClick={() =>
            setShowNewPassword(!showNewPassword)
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
        {showNewPassword ? (
            <FaEyeSlash size={20} />
        ) : (
            <FaEye size={20} />
        )}
    </button>
</div>
<div className="relative">
    <input
        type={showConfirmPassword ? "text" : "password"}
        name="confirm_password"
        value={passwordForm.confirm_password}
        onChange={handlePasswordChange}
        placeholder="Confirm Password"
        className="w-full border rounded-xl p-3 pr-12"
    />

    <button
        type="button"
        onClick={() =>
            setShowConfirmPassword(!showConfirmPassword)
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
        {showConfirmPassword ? (
            <FaEyeSlash size={20} />
        ) : (
            <FaEye size={20} />
        )}
    </button>
</div>
<div className="flex justify-end">
    <button
        type="submit"
        className="
bg-red-600
hover:bg-red-700
text-white
px-8
py-3
rounded-xl
"
    >
        Change Password
    </button>
</div>
</form>

        </div>
    );
};

export default TeacherSettings;