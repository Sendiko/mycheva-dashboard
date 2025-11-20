
import Link from 'next/link';
import { ArrowRight, Code, Gamepad, Layout, Smartphone, Rocket, Server } from 'lucide-react';

export default function Home() {
  const divisions = [
    {
      name: 'Start Up and Competition',
      icon: Rocket,
      description: 'Fostering innovation and competitive spirit in tech challenges.',
    },
    {
      name: 'UI/UX',
      icon: Layout,
      description: 'Designing intuitive and beautiful user experiences.',
    },
    {
      name: 'Front End Development',
      icon: Code,
      description: 'Building responsive and interactive web interfaces.',
    },
    {
      name: 'Back End Development',
      icon: Server,
      description: 'Architecting robust server-side systems and databases.',
    },
    {
      name: 'Mobile Development',
      icon: Smartphone,
      description: 'Creating powerful applications for iOS and Android.',
    },
    {
      name: 'Game Development',
      icon: Gamepad,
      description: 'Crafting immersive gaming experiences and mechanics.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-neutral-50)]/80 backdrop-blur-md border-b border-[var(--color-neutral-200)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-[var(--color-primary-600)] font-bold text-2xl">Chevalier Laboratory</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)] transition-colors">Home</a>
              <a href="#about" className="text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)] transition-colors">About</a>
              <a href="#divisions" className="text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)] transition-colors">Divisions</a>
              <Link
                href="/login"
                className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-block p-2 px-4 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-medium text-sm mb-6">
          Welcome to Chevalier Laboratory SAS
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-neutral-900)] mb-6">
          Innovating the Future of <span className="text-[var(--color-primary-600)]">Technology</span>
        </h1>
        <p className="text-xl text-[var(--color-neutral-600)] max-w-2xl mb-10">
          Research and Study Group Laboratory in School of Applied Science in Telkom University.
          We focus on IT Products research and study the latest technology in programming.
        </p>
        <div className="flex gap-4">
          <a
            href="#divisions"
            className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[var(--color-primary-200)] flex items-center gap-2"
          >
            Explore Divisions <ArrowRight size={20} />
          </a>
          <a
            href="#about"
            className="bg-white border border-[var(--color-neutral-200)] hover:border-[var(--color-primary-200)] text-[var(--color-neutral-700)] px-8 py-3 rounded-xl font-semibold transition-all hover:bg-[var(--color-neutral-50)]"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--color-neutral-900)]">
                About Our Laboratory
              </h2>
              <p className="text-[var(--color-neutral-600)] text-lg mb-6 leading-relaxed">
                Chevalier Laboratory SAS is a dedicated hub for innovation and learning within the School of Applied Science at Telkom University.
              </p>
              <p className="text-[var(--color-neutral-600)] text-lg mb-6 leading-relaxed">
                Our mission is to empower students to master the latest programming technologies and apply them in creating impactful IT products. We foster a collaborative environment where research meets practical application.
              </p>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] flex items-center justify-center">
              {/* Placeholder for an actual image */}
              <div className="text-[var(--color-primary-300)] flex flex-col items-center">
                <Code size={64} className="mb-4 opacity-50" />
                <span className="font-medium">Innovation Hub</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section id="divisions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--color-neutral-900)]">Our Study Groups</h2>
          <p className="text-[var(--color-neutral-600)] max-w-2xl mx-auto">
            Specialized divisions focusing on key areas of modern technology and development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {divisions.map((division, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-white border border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] hover:shadow-xl hover:shadow-[var(--color-primary-100)] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <division.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--color-neutral-900)]">{division.name}</h3>
              <p className="text-[var(--color-neutral-600)] leading-relaxed">
                {division.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--color-neutral-200)] bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--color-neutral-500)]">
          <p>© {new Date().getFullYear()} Chevalier Laboratory SAS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}