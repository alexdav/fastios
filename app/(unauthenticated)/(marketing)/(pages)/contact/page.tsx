export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-xl text-slate-600">
          We'd love to hear from you. Get in touch with our team.
        </p>
      </div>

      {/* Contact Form */}
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Send us a message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Get in touch</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600">support@fastios.com</p>
              <p className="text-slate-600">sales@fastios.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Office Hours</h3>
              <p className="text-slate-600">Monday - Friday: 9:00 AM - 6:00 PM PST</p>
              <p className="text-slate-600">Saturday - Sunday: Closed</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Response Time</h3>
              <p className="text-slate-600">
                We typically respond within 24 hours during business days.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Social Media</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-600 hover:text-slate-900">Twitter</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">LinkedIn</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">GitHub</a>
              </div>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-8 p-6 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">Looking for answers?</h3>
            <p className="text-slate-600 mb-4">
              Check out our frequently asked questions for quick help.
            </p>
            <a
              href="/faq"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit FAQ →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}