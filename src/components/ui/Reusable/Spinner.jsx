import { motion } from "framer-motion";

export default function Spinner() {
    return (
        <>
            <motion.div
                className="w-5 h-5 border-2 border-t-transparent border-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
        </>
    );
}