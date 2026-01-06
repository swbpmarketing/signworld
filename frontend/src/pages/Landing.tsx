import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import emailService from '../services/emailService';

const Landing = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Sign Nexus by Sign World - Digital Transformation Proposal';
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailService.sendContactForm({
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.subject ? `${contactForm.subject}\n\n${contactForm.message}` : contactForm.message
      });

      toast.success('Thank you for contacting us! We\'ll get back to you soon.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Business Intelligence',
      description: 'Real-time analytics and comprehensive reports to track your business performance and growth metrics.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30'
    },
    {
      icon: UsersIcon,
      title: 'Network Directory',
      description: 'Connect with fellow SignWorld franchisees across the country and build valuable partnerships.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30'
    },
    {
      icon: VideoCameraIcon,
      title: 'Video Training Library',
      description: 'Access extensive training materials and tutorials to enhance your skills and operations.',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30'
    },
    {
      icon: BookOpenIcon,
      title: 'Resource Library',
      description: 'Download templates, guides, and marketing materials to streamline your business processes.',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Community Forum',
      description: 'Share insights, ask questions, and collaborate with other franchise owners in real-time.',
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Vendor Management',
      description: 'Access trusted vendors and suppliers with exclusive pricing for SignWorld franchisees.',
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30'
    }
  ];

  const benefits = [
    {
      icon: RocketLaunchIcon,
      title: 'Accelerate Growth',
      description: 'Leverage powerful tools and insights to grow your franchise faster'
    },
    {
      icon: LightBulbIcon,
      title: 'Expert Guidance',
      description: 'Access industry expertise and best practices from successful owners'
    },
    {
      icon: ClockIcon,
      title: 'Save Time',
      description: 'Streamline operations with automated workflows and templates'
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ backgroundColor: '#0A0B0D' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-0 right-0 bottom-0 opacity-40"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(0, 166, 251, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(0, 166, 251, 0.04) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Noise Background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
        }}
      />

      {/* Animated Gradient Orbs */}
      <div
        className="fixed -top-64 -right-32 w-[600px] h-[600px] rounded-full blur-[80px] opacity-60 pointer-events-none z-0 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(0, 166, 251, 0.3) 0%, transparent 70%)',
          animation: 'float 25s infinite ease-in-out'
        }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-60 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, transparent 70%)',
          animation: 'float 25s infinite ease-in-out 10s'
        }}
      />

      {/* Animated Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 166, 251, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 166, 251, 0.2) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 15s linear infinite'
        }}
      />

      {/* Additional Animated Orbs */}
      <div
        className="fixed top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[80px] opacity-40 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0, 166, 251, 0.15) 0%, transparent 70%)',
          animation: 'float 30s infinite ease-in-out 5s'
        }}
      />

      {/* Shooting Stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute w-1 h-1 bg-white rounded-full blur-sm"
          style={{
            top: '20%',
            left: '-100px',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            animation: 'shootingStar 3s linear infinite'
          }}
        />
        <div
          className="absolute w-1 h-1 bg-white rounded-full blur-sm"
          style={{
            top: '40%',
            left: '-100px',
            boxShadow: '0 0 10px rgba(0, 166, 251, 0.8)',
            animation: 'shootingStar 4s linear infinite 1s'
          }}
        />
        <div
          className="absolute w-0.5 h-0.5 bg-white rounded-full blur-sm"
          style={{
            top: '60%',
            left: '-100px',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
            animation: 'shootingStar 3.5s linear infinite 2s'
          }}
        />
        <div
          className="absolute w-1 h-1 bg-white rounded-full blur-sm"
          style={{
            top: '30%',
            left: '-100px',
            boxShadow: '0 0 10px rgba(0, 166, 251, 0.8)',
            animation: 'shootingStar 5s linear infinite 0.5s'
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            {/* Floating badge */}
            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-full mb-8 border border-blue-500/30 shadow-lg shadow-blue-500/5 backdrop-blur-md animate-fadeInUp">
              <SparklesIcon className="w-5 h-5 text-blue-400 mr-2.5 animate-pulse" />
              <span className="text-sm font-bold text-blue-300 tracking-wide">
                Franchise Owner Portal
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              Empower Your
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 animate-gradient bg-[length:200%_auto]">
                SignWorld Business
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              Your all-in-one platform for business intelligence, training resources,
              and franchise community engagement
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => navigate('/login')}
                className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center space-x-3 transform hover:-translate-y-1 border border-blue-400/20 overflow-hidden bg-[length:200%_auto]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative z-10 text-lg">Access Portal</span>
                <ArrowRightIcon className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="group px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 transform hover:-translate-y-1 border border-white/20 backdrop-blur-xl hover:border-white/40"
              >
                <span className="text-lg">Create Account</span>
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-6 z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-5 py-2 bg-blue-500/10 rounded-full mb-6 border border-blue-500/30 backdrop-blur-md">
              <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm font-bold text-blue-300">Why Choose Us</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Built for Your Success
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative p-8 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:border-blue-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 rounded-2xl transition-all duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Interactive Hover-Reveal Cards */}
      <section className="relative py-24 px-6 z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
              Comprehensive tools and resources designed specifically for SignWorld franchise owners
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative flex items-center gap-6 p-6 rounded-xl bg-gray-800/20 border border-gray-700/30 hover:border-gray-700/60 transition-all duration-500 hover:bg-gray-800/40 overflow-hidden"
              >
                {/* Vertical Gradient Anchor Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Icon Container */}
                <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all duration-500">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm group-hover:text-gray-100 transition-colors duration-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 z-10 overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          {/* Animated background orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0, 166, 251, 0.2) 0%, transparent 70%)', animation: 'float 20s infinite ease-in-out' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(100, 150, 200, 0.15) 0%, transparent 70%)', animation: 'float 25s infinite ease-in-out 5s' }} />

          <div className="relative group">
            {/* Enhanced outer glow - toned down */}
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 via-blue-400 to-slate-500 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

            {/* Secondary glow layer - more subtle */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/15 to-slate-500/15 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" />

            <div className="relative bg-gradient-to-br from-slate-700 to-blue-700 rounded-3xl p-12 md:p-20 text-center shadow-2xl border border-slate-500/20 overflow-hidden">
              {/* Subtle light streaks */}
              <div className="absolute top-0 left-1/4 w-1 h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-1/4 w-1 h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <div className="relative">
                <h2 className="relative text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Grow Your Franchise
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-100 to-blue-300">
                    Faster
                  </span>
                </h2>

                <p className="relative text-base md:text-lg text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-normal">
                  Tools, insights, and automation built for franchise owners.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="relative group/btn px-12 py-4 bg-white text-slate-700 font-bold rounded-xl shadow-2xl hover:shadow-3xl hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1 text-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                    <span className="flex items-center space-x-3 relative z-10">
                      <span>Access Portal</span>
                      <ArrowRightIcon className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('/signup')}
                    className="relative group/btn px-12 py-4 bg-white/10 hover:bg-white/15 text-slate-100 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg border border-white/15 backdrop-blur-md"
                  >
                    <span className="flex items-center space-x-3">
                      <span>Create Account</span>
                      <ArrowRightIcon className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24 px-6 z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Get in Touch
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
              Have questions about our franchise portal? We're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="space-y-6">
                {[
                  {
                    icon: EnvelopeIcon,
                    title: 'Email',
                    value: 'support@signworld.com',
                    gradient: 'from-blue-500 to-cyan-500'
                  },
                  {
                    icon: PhoneIcon,
                    title: 'Phone',
                    value: '1-800-SIGNWORLD',
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  {
                    icon: MapPinIcon,
                    title: 'Office',
                    value: 'SignWorld Headquarters\nBusiness Address\nCity, State ZIP',
                    gradient: 'from-orange-500 to-red-500'
                  }
                ].map((item, index) => (
                  <div key={index} className="group flex items-start space-x-5 p-6 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-500/40">
                    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2 text-lg">{item.title}</h4>
                      <p className="text-gray-300 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-blue-500/10 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                <h4 className="font-bold text-white mb-4 text-lg flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Business Hours
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p className="font-medium">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p className="font-medium">Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl border border-blue-500/20">
                <h3 className="text-3xl font-bold text-white mb-8">
                  Send us a Message
                </h3>

                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border-2 border-blue-500/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border-2 border-blue-500/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border-2 border-blue-500/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-5 py-4 border-2 border-blue-500/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all resize-none font-medium backdrop-blur-sm"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full px-8 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 text-lg overflow-hidden relative bg-[length:200%_auto]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    {isSubmitting ? (
                      <span className="flex items-center justify-center relative z-10">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2 relative z-10">
                        <span>Send Message</span>
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-blue-500/20 bg-gray-900 z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4">
            <img
              src="/logo.png"
              alt="SignWorld Logo"
              className="h-12 w-auto mx-auto object-contain opacity-60"
              style={{ maxWidth: '200px' }}
            />
            <p className="text-gray-400 font-medium">
              © {new Date().getFullYear()} SignWorld. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Franchise Owner Portal - Business Intelligence & Resources
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg) scale(0.9);
          }
        }

        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 50px 50px;
          }
        }

        @keyframes shootingStar {
          0% {
            left: -100px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-gradient {
          animation: gradient 8s ease infinite;
        }

        .animate-float {
          animation: float 25s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Landing;
