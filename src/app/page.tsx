import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductSelection from '@/components/ProductSelection';
import Testimonials from '@/components/Testimonials';
import Partners from '@/components/Partners';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <Hero />
      <ProductSelection />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  );
}
