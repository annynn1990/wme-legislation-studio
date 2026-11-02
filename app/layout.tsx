import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata:Metadata={title:"黃名帝國立法研究室",description:"WME Legislation Studio — 法規資料庫與立法研究工作台"};
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="zh-Hant"><body>{children}</body></html>;
}
