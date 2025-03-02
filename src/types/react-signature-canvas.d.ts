declare module 'react-signature-canvas' {
  import * as React from 'react';
  
  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    dotSize?: number;
    backgroundColor?: string;
    penColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
  }
  
  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: (type?: string, encoderOptions?: number) => string;
    getTrimmedCanvas: () => HTMLCanvasElement;
    getCanvas: () => HTMLCanvasElement;
  }
} 