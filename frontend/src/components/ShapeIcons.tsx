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
        {/* 3D Cube with proper perspective */}
        {/* Front face */}
        <rect
            x="6"
            y="8"
            width="8"
            height="8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Top face */}
        <path
            d="M6 8L10 4L18 4L14 8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Right face */}
        <path
            d="M14 8L18 4L18 12L14 16"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Bottom face */}
        <path
            d="M6 16L10 12L18 12L14 16"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Left face */}
        <path
            d="M6 8L6 16L10 12L10 4"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Back face (dashed for depth) */}
        <path
            d="M10 4L18 4L18 12L10 12Z"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
            strokeDasharray="2,2"
        />
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
        {/* Flat plane - main rectangle */}
        <rect
            x="4"
            y="10"
            width="16"
            height="4"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Grid lines to show it's a flat surface */}
        <line
            x1="6"
            y1="10"
            x2="6"
            y2="14"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        <line
            x1="10"
            y1="10"
            x2="10"
            y2="14"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        <line
            x1="14"
            y1="10"
            x2="14"
            y2="14"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        <line
            x1="18"
            y1="10"
            x2="18"
            y2="14"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        <line
            x1="4"
            y1="11"
            x2="20"
            y2="11"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        <line
            x1="4"
            y1="13"
            x2="20"
            y2="13"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
        />
        {/* Corner indicators to show it's flat */}
        <circle cx="4" cy="10" r="1" fill={color} opacity="0.8" />
        <circle cx="20" cy="10" r="1" fill={color} opacity="0.8" />
        <circle cx="4" cy="14" r="1" fill={color} opacity="0.8" />
        <circle cx="20" cy="14" r="1" fill={color} opacity="0.8" />
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

export const DirectionalLightIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Sun with rays */}
        <circle
            cx="12"
            cy="12"
            r="3"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Sun rays */}
        <line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth="1.5" />
        <line
            x1="12"
            y1="20"
            x2="12"
            y2="22"
            stroke={color}
            strokeWidth="1.5"
        />
        <line x1="2" y1="12" x2="4" y2="12" stroke={color} strokeWidth="1.5" />
        <line
            x1="20"
            y1="12"
            x2="22"
            y2="12"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="4.93"
            y1="4.93"
            x2="6.34"
            y2="6.34"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="17.66"
            y1="17.66"
            x2="19.07"
            y2="19.07"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="19.07"
            y1="4.93"
            x2="17.66"
            y2="6.34"
            stroke={color}
            strokeWidth="1.5"
        />
        <line
            x1="6.34"
            y1="17.66"
            x2="4.93"
            y2="19.07"
            stroke={color}
            strokeWidth="1.5"
        />
    </svg>
);

export const PointLightIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Light bulb */}
        <circle
            cx="12"
            cy="12"
            r="4"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Light rays emanating outward */}
        <circle
            cx="12"
            cy="12"
            r="8"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
        />
        {/* Base of light bulb */}
        <rect
            x="10"
            y="16"
            width="4"
            height="2"
            rx="1"
            fill={color}
            opacity="0.8"
        />
    </svg>
);

export const SpotLightIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Spotlight cone */}
        <path
            d="M12 2L8 8L12 14L16 8L12 2Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
        />
        {/* Light beam */}
        <path
            d="M8 8L6 16L12 14L18 16L16 8"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        {/* Base */}
        <rect
            x="10"
            y="16"
            width="4"
            height="2"
            rx="1"
            fill={color}
            opacity="0.8"
        />
    </svg>
);

export const AmbientLightIcon: React.FC<ShapeIconProps> = ({
    size = 24,
    color = "#e6e9ef",
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Ambient light symbol - soft glow */}
        <circle
            cx="12"
            cy="12"
            r="6"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
        />
        <circle
            cx="12"
            cy="12"
            r="4"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.6"
        />
        <circle
            cx="12"
            cy="12"
            r="2"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
        />
        {/* Soft rays */}
        <path
            d="M12 6C12 6 15 9 15 12C15 15 12 18 12 18C12 18 9 15 9 12C9 9 12 6 12 6Z"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
        />
    </svg>
);
