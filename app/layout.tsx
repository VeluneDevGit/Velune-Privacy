import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Velune — Your private side of onchain',description:'Explore markets, prepare private transfers, and keep your files yours. A new privacy layer for Robinhood Chain.',icons:{icon:[{url:'/assets/velune-favicon-v5.svg',type:'image/svg+xml'},{url:'/assets/velune-favicon-v5.png',type:'image/png',sizes:'192x192'}],shortcut:'/favicon.ico?v=5',apple:'/assets/velune-apple-icon-v5.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
