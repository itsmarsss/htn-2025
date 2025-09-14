import React from "react";

interface ShapeIconProps {
    size?: number;
    color?: string;
}

export const BoxIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Box with perspective */}
        <path
            d="M3 7L12 2L21 7V17L12 22L3 17V7Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Top face */}
        <path d="M3 7L12 2L21 7" stroke={color} strokeWidth="1.5" fill="none" />
        {/* Right face */}
        <path d="M21 7V17L12 22" stroke={color} strokeWidth="1.5" fill="none" />
        {/* Left face */}
        <path d="M3 7V17L12 22" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
);

export const SphereIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Sphere with longitude/latitude lines */}
        <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="9"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Longitude lines */}
        <ellipse
            cx="12"
            cy="12"
            rx="6"
            ry="9"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        <ellipse
            cx="12"
            cy="12"
            rx="3"
            ry="9"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
        />
        {/* Latitude lines */}
        <ellipse
            cx="12"
            cy="8"
            rx="9"
            ry="3"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        <ellipse
            cx="12"
            cy="16"
            rx="9"
            ry="3"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
    </svg>
);

export const CylinderIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Cylinder */}
        <ellipse
            cx="12"
            cy="6"
            rx="8"
            ry="3"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        <ellipse
            cx="12"
            cy="18"
            rx="8"
            ry="3"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Side lines */}
        <line x1="4" y1="6" x2="4" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="20" y1="6" x2="20" y2="18" stroke={color} strokeWidth="1.5" />
        {/* Inner ellipse for depth */}
        <ellipse
            cx="12"
            cy="6"
            rx="6"
            ry="2"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
    </svg>
);

export const ConeIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Cone */}
        <ellipse
            cx="12"
            cy="18"
            rx="8"
            ry="3"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Cone sides */}
        <line x1="12" y1="4" x2="4" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="4" x2="20" y2="18" stroke={color} strokeWidth="1.5" />
        {/* Inner ellipse for depth */}
        <ellipse
            cx="12"
            cy="18"
            rx="6"
            ry="2"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
    </svg>
);

export const TorusIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Torus - outer ring */}
        <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="6"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Inner ring */}
        <ellipse
            cx="12"
            cy="12"
            rx="6"
            ry="4"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Perspective lines */}
        <ellipse
            cx="12"
            cy="10"
            rx="8"
            ry="5"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        <ellipse
            cx="12"
            cy="14"
            rx="8"
            ry="5"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
    </svg>
);

export const PlaneIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Plane with perspective */}
        <rect
            x="4"
            y="8"
            width="16"
            height="8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Top face */}
        <path
            d="M4 8L8 4L20 4L16 8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Right face */}
        <path
            d="M20 4L20 12L16 16L16 8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Left face */}
        <path
            d="M8 4L8 12L4 16L4 8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
    </svg>
);

export const DuplicateIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Copy icon */}
        <rect
            x="4"
            y="4"
            width="12"
            height="12"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        <rect
            x="8"
            y="8"
            width="12"
            height="12"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
    </svg>
);

export const DeleteIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Trash can icon */}
        <path d="M3 6H5H21" stroke={color} strokeWidth="1.5" />
        <path
            d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        <line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
            stroke={color}
            strokeWidth="1.5"
        />
    </svg>
);
