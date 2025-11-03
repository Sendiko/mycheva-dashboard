import type { Metadata } from 'next';
import { Poppins } from 'next/font/google'; // 1. Import the font
import './globals.css'; // <-- PREVIEW FIX: Commented out for preview

// 2. Configure the font with all the weights from your style guide
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins', // 3. Set the CSS variable name
  weight: ['400', '500', '600', '700'], // Regular, Medium, Semibold, Bold
});


export const metadata: Metadata = {
  title: 'MyCheva Dashboard',
  description: 'MyCheva Application Dashboard',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 4. Apply the variable to the <html> tag
    <html lang="en" className={`${poppins.variable}`}> 
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
