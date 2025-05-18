declare module "@/components/ui/button" {
  import React from "react";
  export function Button(
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children?: React.ReactNode;
    }
  ): JSX.Element;
}

declare module "@/components/ui/card" {
  import React from "react";
  export function Card(props: {
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }): JSX.Element;

  export function CardContent(props: {
    children?: React.ReactNode;
    className?: string;
  }): JSX.Element;
}
