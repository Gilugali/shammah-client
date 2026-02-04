const Developer = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Profile Picture Section - Centered */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 px-6 pt-8 pb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md ring-2 ring-teal-100 overflow-hidden">
                <img
                  src="/profile-picture.png"
                  alt="Developer Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Status indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-sm"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              System Developer
            </h2>
            <p className="text-xs text-gray-600 text-center">
              Please don’t hesitate to reach out if you need any support or
              assistance.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href="mailto:developer@shammah.clinic"
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline break-all"
                  >
                    gilugali.work@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href="tel:+250788123456"
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    +1 503 209 3002
                  </a>
                </div>
              </div>

              {/* GitHub */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
