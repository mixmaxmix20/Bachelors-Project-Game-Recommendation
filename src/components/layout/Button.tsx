import React from "react";

interface ButtonProps {
    onClickPar?: () => void,
    children?: React.ReactNode,
    isLogout?: boolean
}

function Button({ onClickPar, children, isLogout }: ButtonProps) {
    const baseClasses = "flex items-center border-none text-white bg-[#1f2326] py-3 px-6 m-2 text-2xl rounded-lg cursor-pointer w-[88%] opacity-0 overflow-hidden transition-all duration-300 hover:scale-105 group-hover:opacity-100"
    const colorClasses = isLogout ? "bg-[#1f2326] hover:bg-red-600" : "bg-[#1f2326] hover:bg-[#2b2d39]"
    return (
        <button
            onClick={onClickPar}
            className={`${baseClasses} ${colorClasses}`}
        >
            <span className="hidden whitespace-nowrap group-hover:inline-block">{children}</span>
        </button>
    )
}

export default Button;