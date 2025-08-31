import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GlobeAltIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  BellIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: GlobeAltIcon,
    title: 'Decentralized Monitoring',
    description: 'Monitor your websites from multiple nodes worldwide for true redundancy and reliability.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Blockchain Verified',
    description: 'All monitoring data is recorded on-chain for transparency and immutable history.'
  },
  {
    icon: CpuChipIcon,
    title: 'Smart Contracts',
    description: 'Automated reward distribution and consensus mechanisms powered by Ethereum smart contracts.'
  },
  {
    icon: BellIcon,
    title: 'Instant Notifications',
    description: 'Get notified immediately when your website goes down via email, Discord, Slack, or webhooks.'
  },
  {
    icon: ChartBarIcon,
    title: 'Detailed Analytics',
    description: 'View comprehensive uptime statistics, response times, and historical performance data.'
  },
  {
    icon: UserGroupIcon,
    title: 'Node Operators',
    description: 'Run monitoring nodes and earn tokens by providing reliable monitoring services.'
  }
];

const stats = [
  { label: 'Websites Monitored', value: '10,000+' },
  { label: 'Monitoring Nodes', value: '500+' },
  { label: 'Average Uptime', value: '99.9%' },
  { label: 'Countries', value: '50+' }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">Web3 Monitor</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Decentralized Website
              <span className="text-gradient block">Monitoring Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Monitor your websites with Web3 technology. Multiple nodes worldwide check your sites, 
              all verified on blockchain with instant notifications when issues arise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Monitoring
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="btn-outline text-lg px-8 py-4">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Web3 Monitoring?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Traditional monitoring relies on single points of failure. Our decentralized approach 
              ensures reliability, transparency, and trust.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple setup, powerful monitoring with blockchain verification
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Register Website</h3>
              <p className="text-gray-600">
                Add your website URL and configure monitoring settings like check interval and timeout.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nodes Monitor</h3>
              <p className="text-gray-600">
                Multiple monitoring nodes worldwide check your website and submit results to the blockchain.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Notified</h3>
              <p className="text-gray-600">
                Receive instant notifications when downtime is detected and view detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Pay only for what you use with our token-based system
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">$0</div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">5 monitors</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">5-minute intervals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Email notifications</span>
                  </li>
                </ul>
                <Link to="/register" className="btn-outline w-full">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="card border-primary-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="badge-primary">Most Popular</span>
              </div>
              <div className="card-body">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">$29<span className="text-lg text-gray-600">/mo</span></div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">50 monitors</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">1-minute intervals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">All notifications</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">API access</span>
                  </li>
                </ul>
                <Link to="/register" className="btn-primary w-full">
                  Start Pro Trial
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">Custom</div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Unlimited monitors</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">30-second intervals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Custom integrations</span>
                  </li>
                </ul>
                <button className="btn-outline w-full">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Monitoring?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of websites already being monitored by our decentralized network
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Web3 Monitor</h3>
              <p className="text-gray-400">
                Decentralized website monitoring powered by blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Status Page</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Web3 Monitor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;