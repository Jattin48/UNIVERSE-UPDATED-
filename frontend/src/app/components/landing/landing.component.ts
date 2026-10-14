import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit, OnDestroy {
  stats = [
    { label: 'Colleges Listed', target: 500, current: 0, suffix: '+' },
    { label: 'Students Enrolled', target: 10000, current: 0, suffix: '+' },
    { label: 'States Covered', target: 28, current: 0, suffix: '' },
    { label: 'Courses Available', target: 1200, current: 0, suffix: '+' },
  ];

  features = [
    {
      icon: '🔍',
      title: 'Smart Search & Filter',
      desc: 'Filter by cutoff marks, fees, state, college type, and facilities to find your perfect match instantly.',
    },
    {
      icon: '⚖️',
      title: 'Side-by-Side Comparison',
      desc: 'Compare up to 3 colleges simultaneously across NIRF rank, fees, cutoffs, and facilities.',
    },
    {
      icon: '❤️',
      title: 'Personalized Shortlist',
      desc: 'Save your favourite colleges and revisit them anytime from your personalized profile.',
    },
    {
      icon: '🔐',
      title: 'Secure & Verified',
      desc: 'JWT-secured accounts with 6-digit OTP email verification and Role-Based Access Control.',
    },
    {
      icon: '📱',
      title: 'Fully Responsive',
      desc: 'Seamlessly designed to work across all devices — desktop, tablet, and mobile.',
    },
    {
      icon: '🎓',
      title: 'Multi-Role Platform',
      desc: 'Dedicated portals for Students, College Administrators, and Platform Super Admins.',
    },
  ];

  steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      desc: 'Sign up in seconds. Tell us your 12th percentage, preferred state, and budget.',
      icon: '👤',
    },
    {
      number: '02',
      title: 'Search & Compare',
      desc: 'Filter thousands of colleges and compare them side-by-side on every metric that matters.',
      icon: '🔍',
    },
    {
      number: '03',
      title: 'Shortlist & Apply',
      desc: 'Add colleges to your personal shortlist and confidently prepare for your applications.',
      icon: '🚀',
    },
  ];

  sampleColleges = [
    {
      name: 'IIT Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      type: 'Government',
      cutoff: 98,
      fee: '₹2.2L/yr',
      rating: 4.9,
      nirfRank: 2,
      tag: '⭐ Top Ranked',
      tagClass: 'tag-top',
    },
    {
      name: 'BITS Pilani',
      city: 'Pilani',
      state: 'Rajasthan',
      type: 'Private',
      cutoff: 95,
      fee: '₹5.2L/yr',
      rating: 4.8,
      nirfRank: 18,
      tag: '🔥 Highly Sought',
      tagClass: 'tag-hot',
    },
    {
      name: 'SRCC Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      type: 'Government',
      cutoff: 99,
      fee: '₹45K/yr',
      rating: 4.9,
      nirfRank: 5,
      tag: '🏆 Commerce Elite',
      tagClass: 'tag-elite',
    },
  ];

  roles = [
    {
      icon: '🎓',
      title: 'For Students',
      desc: 'Discover colleges, compare options, manage your shortlist, and track your journey — all in one beautiful profile.',
      cta: 'Start Exploring',
      link: '/signup',
      gradient: 'role-student',
    },
    {
      icon: '🏫',
      title: 'For Colleges',
      desc: 'Register your institution, manage course details, update cutoffs, and connect with thousands of aspirants.',
      cta: 'Register College',
      link: '/signup',
      gradient: 'role-college',
    },
    {
      icon: '🛡️',
      title: 'For Admins',
      desc: 'Oversee the entire platform — approve college listings, manage users, and maintain platform integrity.',
      cta: 'Admin Panel',
      link: '/login',
      gradient: 'role-admin',
    },
  ];

  private statsAnimated = false;
  private animFrames: any[] = [];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.observeSections();
  }

  ngOnDestroy(): void {
    this.animFrames.forEach((f) => cancelAnimationFrame(f));
  }

  private observeSections(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('stats-section') && !this.statsAnimated) {
              this.statsAnimated = true;
              this.animateCounters();
            }
          }
        });
      },
      { threshold: 0.15 }
    );
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 100);
  }

  private animateCounters(): void {
    this.stats.forEach((stat, i) => {
      const duration = 2000;
      const steps = 60;
      const increment = stat.target / steps;
      let current = 0;
      let step = 0;

      const run = () => {
        step++;
        current = Math.min(Math.round(increment * step), stat.target);
        this.stats[i] = { ...this.stats[i], current };
        if (current < stat.target) {
          this.animFrames.push(setTimeout(run, duration / steps));
        }
      };
      this.animFrames.push(setTimeout(run, i * 150));
    });
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  }
}
