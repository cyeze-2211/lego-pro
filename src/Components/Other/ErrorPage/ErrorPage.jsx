import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg rounded-2xl">
                <CardBody className="flex flex-col items-center text-center gap-6 p-8">
                    {/* Icon */}
                    <div className="bg-red-100 text-red-600 rounded-full p-6">
                        <ExclamationTriangleIcon className="h-16 w-16" />
                    </div>

                    {/* Title */}
                    <Typography variant="h4" className="font-bold text-gray-900">
                        Xatolik yuz berdi
                    </Typography>

                    {/* Subtitle */}
                    <Typography className="text-gray-600">
                        Kechirasiz, sahifa  mavjud emas.
                        Iltimos qaytadan urinib ko‘ring yoki bosh sahifaga qayting.
                    </Typography>

                    {/* Button */}
                    <Button
                        color="red"
                        size="lg"
                        className="mt-4"
                        onClick={() => navigate("/")}
                    >
                        Bosh sahifaga qaytish
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}
