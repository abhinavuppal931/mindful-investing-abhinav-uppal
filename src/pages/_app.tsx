
import { AppProps } from 'next/app';
import App from '../App';
import '../index.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <App Component={Component} pageProps={pageProps} />
  );
}

export default MyApp;
