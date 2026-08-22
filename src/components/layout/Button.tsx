import React from "react";

interface ButtonProps {
    onClickPar?: () => void,
    isStandalone?: boolean,
    children?: React.ReactNode,
    isLogout?: boolean
}

function Button({ onClickPar, isStandalone, children, isLogout }: ButtonProps) {
    let opacity, spanHidden;
    if (isStandalone) {
        opacity = "";
        spanHidden = "";
    } else {
        opacity = "opacity-0 group-hover:opacity-100 w-[88%] pointer-events-none group-hover:pointer-events-auto";
        spanHidden = "inline-block"
    }
    const baseClasses = "flex items-center border border-transparent text-white bg-[#1f2326] py-3 px-6 m-2 text-2xl rounded-lg cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:border-gray-400"
    const colorClasses = isLogout ? "bg-[#1f2326] hover:bg-red-600" : "bg-[#1f2326] hover:bg-[#2b2d39]"
    return (
        <button
            onClick={onClickPar}
            className={`${baseClasses} ${colorClasses} ${opacity}`}
        >
            <span className={`whitespace-nowrap ${spanHidden}`}>{children}</span>
        </button>
    )
}

export default Button;