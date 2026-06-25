import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/assets/logo.jpg"
              alt="Sefwi-Wiawso Police Division logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-xl font-bold">WellTrack</span>
          </div>
          <p className="text-slate-400 mb-6 max-w-sm">
            Supporting the mental health and wellness of law enforcement
            professionals across the nation.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 WellTrack. All rights reserved.
          </p>
          <p className="text-slate-400 text-sm">
            Developed by Inusah Adama & Sedzro Rebecca
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
