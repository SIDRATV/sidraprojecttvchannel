'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Newspaper, Search, Calendar, User, Share2, Heart, MessageCircle, TrendingUp, Filter, X, Send, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: number;
  likes: number;
  comments: number;
  featured: boolean;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Revolutionary AI Technology Transforms Islamic Education',
    description: 'New artificial intelligence solutions are changing how Islamic studies are taught globally',
    content: `Revolutionary AI technology is transforming the landscape of Islamic education worldwide. This groundbreaking initiative combines cutting-edge artificial intelligence with traditional Islamic scholarship, creating a unique learning experience.

The new platform uses machine learning algorithms to personalize educational content for each student, adapting to their learning pace and understanding. Real-time analysis of student performance allows instructors to identify knowledge gaps and provide targeted support.

Key features include:
- Personalized learning paths tailored to individual students
- Interactive Quranic analysis tools with historical context
- Real-time collaboration between students across different countries
- AI-powered language learning for Arabic fluency
- Assessment tools that measure comprehension and retention

Early results show a 40% improvement in student engagement and a 35% increase in knowledge retention compared to traditional methods. Over 50,000 students from 25 countries have already benefited from this innovative approach.

The initiative has received support from leading educational institutions and aims to reach 1 million students by 2027. Educators are encouraged to integrate these tools into their curriculum, and scholarships are available for underprivileged students.

This is more than just technology—it's a movement to democratize Islamic education and make world-class learning accessible to everyone, regardless of geographic location or economic background.`,
    category: 'Technology',
    author: 'Dr. Ahmed Hassan',
    date: 'Today',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
    readTime: 5,
    likes: 1245,
    comments: 98,
    featured: true,
  },
  {
    id: '2',
    title: 'Sustainable Development Initiative Reaches New Milestone',
    description: 'Global partnership announces major achievement in environmental restoration',
    content: `The Sustainable Development Initiative has announced a historic milestone: the restoration of 1 million acres of land across three continents. This achievement represents years of dedicated effort by thousands of volunteers and environmental scientists.

The initiative focuses on reforestation, wetland restoration, and soil regeneration in vulnerable ecosystems. By implementing traditional ecological knowledge alongside modern scientific approaches, the project has achieved remarkable results in biodiversity recovery.

Key achievements include:
- 1 million acres of land restored across Africa, Asia, and Latin America
- 50 million trees planted
- Habitat for 200+ endangered species preserved
- Carbon sequestration potential of 10 million tons annually
- Economic benefits of $5 billion to local communities

The program has also created sustainable livelihoods for over 100,000 people in rural areas, through ecotourism, sustainable agriculture, and environmental monitoring jobs.

Looking forward, the initiative plans to expand to 5 million acres by 2030, with increased investment in community-led conservation projects. The success of this initiative demonstrates that environmental restoration and economic development can go hand in hand.

Partner organizations from 45 countries are collaborating on this effort, sharing best practices and innovative solutions for environmental challenges.`,
    category: 'Sustainability',
    author: 'Sarah Johnson',
    date: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=400&fit=crop',
    readTime: 7,
    likes: 892,
    comments: 54,
    featured: true,
  },
  {
    id: '3',
    title: 'Youth Empowerment Program Celebrates 10,000 Graduates',
    description: 'Landmark achievement as education initiative reaches international scale',
    content: `A major milestone has been reached as the Youth Empowerment Program celebrates its 10,000th graduate. This landmark achievement represents the tangible impact of the initiative on young lives across multiple continents.

The program provides comprehensive skill development, mentorship, and employment support to disadvantaged youth aged 16-25. Through a combination of technical training, entrepreneurship education, and soft skills development, the program has empowered a new generation of changemakers.

Program highlights:
- 10,000 graduates across 30 countries
- 85% employment rate within 6 months of graduation
- Average income increase of 250% for participants
- 1,200 start-ups launched by program alumni
- 50,000+ lives directly impacted through participant networks

The curriculum covers diverse fields including digital technology, renewable energy, sustainable agriculture, and social entrepreneurship. Each graduate receives support in launching their own ventures or securing meaningful employment.

Many alumni have become mentors themselves, creating a multiplier effect within their communities. The program has created a global network of young leaders committed to sustainable development and social impact.

Future plans include expanding to 50,000 graduates by 2030, with specialized tracks for women and marginalized communities. Donors and partners are encouraged to join this movement to unlock the potential of the world's youth.`,
    category: 'Education',
    author: 'Fatima Al-Rashid',
    date: '5 hours ago',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    readTime: 4,
    likes: 2341,
    comments: 156,
    featured: false,
  },
  {
    id: '4',
    title: 'Islamic Finance Innovations Attract Global Investment',
    description: 'New digital platforms enable easier access to Shariah-compliant financial services',
    content: `The Islamic finance sector is experiencing rapid growth with innovative digital platforms making Shariah-compliant financial services more accessible than ever. New fintech solutions are attracting billions in global investment and transforming how Muslims manage their finances.

These platforms offer a range of services from digital wallets to investment opportunities, all compliant with Islamic principles. Advanced blockchain technology ensures transparency and security while maintaining Islamic law compliance.

Market developments:
- Global Islamic finance market valued at $2.5 trillion
- Digital Islamic banking platforms growing at 45% annually
- 500+ fintech startups in the Islamic finance space
- Investment opportunities now available to retail investors globally
- Cross-border payments simplified through blockchain technology

Traditional financial barriers are being dismantled as technology enables peer-to-peer lending, equity crowdfunding, and Islamic microfinance for the unbanked population. This financial inclusion is particularly impactful in developing countries.

The innovation doesn't compromise on Islamic principles. Each product undergoes rigorous Shariah compliance review before launch. Leading Islamic scholars work alongside fintech developers to ensure authenticity.

Industry experts predict that Islamic finance will represent 15% of global finance by 2030. Investors, entrepreneurs, and financial institutions are joining this growth story. The future of global finance is increasingly Islamic and increasingly digital.`,
    category: 'Finance',
    author: 'Mohammed Al-Madani',
    date: '1 day ago',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    readTime: 6,
    likes: 1567,
    comments: 123,
    featured: false,
  },
  {
    id: '5',
    title: 'Healthcare Network Launches Community Wellness Program',
    description: 'Comprehensive health initiative aims to improve wellbeing across developing regions',
    content: `The Global Healthcare Network has launched an ambitious Community Wellness Program aimed at improving health outcomes across developing regions. This initiative combines preventive care, health education, and affordable treatment solutions.

The program focuses on addressing the most pressing health challenges facing underserved communities, from infectious diseases to chronic conditions and maternal health.

Program components:
- Mobile health clinics serving 200 communities
- Telemedicine services for remote areas
- Health worker training for 5,000 professionals
- Preventive care education campaigns
- Maternal and child health initiatives
- Nutrition and food security programs

By combining traditional community health workers with modern medical technology, the program achieves remarkable reach. Local healthcare providers are trained to deliver high-quality care using evidence-based protocols.

The program has already helped over 500,000 people access quality healthcare services. Early indicators show significant improvements in vaccination rates, early disease detection, and maternal mortality reduction.

Sustainability is built into the model. Communities are empowered to manage their own health initiatives, with ongoing support from the network. This approach ensures long-term impact beyond initial funding cycles.

Plans for expansion include reaching 2 million people by 2028, with particular focus on women's health and mental health services. The program welcomes partnerships with local and international health organizations.`,
    category: 'Healthcare',
    author: 'Dr. Layla Al-Fahad',
    date: '1 day ago',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    readTime: 8,
    likes: 934,
    comments: 67,
    featured: false,
  },
  {
    id: '6',
    title: 'Creative Arts Festival Celebrates Digital Innovation',
    description: 'International event showcases emerging trends in digital arts and media',
    content: `The International Creative Arts Festival has become a showcase for digital innovation in the arts. This year's edition brought together over 2,000 artists, technologists, and creative professionals from 60 countries to celebrate the intersection of art and technology.

The festival featured groundbreaking installations combining AI, virtual reality, blockchain, and traditional artistic techniques. Attendees witnessed how technology is democratizing creative expression and opening new possibilities for artists worldwide.

Festival highlights:
- 500 artistic installations and performances
- 100 workshops and masterclasses
- NFT art marketplace with $10 million in transactions
- Virtual reality experiences attracting 50,000+ visitors
- Mentorship program connecting 1,000+ emerging artists with established professionals
- Job fair with 200+ creative organizations recruiting

The event demonstrated that digital innovation is not replacing traditional arts but rather expanding the canvas for creative expression. Digital tools are enabling artists from underrepresented communities to share their voices globally.

Virtual attendance options allowed participation from those unable to travel, breaking geographic barriers. The festival's commitment to accessibility and inclusivity made it a truly global celebration of creativity.

Next year's festival will feature expanded digital programming, greater emphasis on sustainable practices, and deeper integration of emerging technologies like AI and augmented reality. Artists are invited to submit proposals for the 2027 festival.

The Creative Arts Festival proves that in the digital age, human creativity remains more valuable than ever.`,
    category: 'Arts & Culture',
    author: 'Hassan Al-Rashid',
    date: '2 days ago',
    image: 'https://images.unsplash.com/photo-1516035069371-29a083244fa5?w=800&h=400&fit=crop',
    readTime: 5,
    likes: 1102,
    comments: 89,
    featured: false,
  },
];

export default function ActualiterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [articleComments, setArticleComments] = useState<Record<string, Comment[]>>({});

  const categories = Array.from(new Set(mockArticles.map((a) => a.category)));
  
  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = filteredArticles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  const toggleLike = (articleId: string) => {
    const newLiked = new Set(likedArticles);
    if (newLiked.has(articleId)) {
      newLiked.delete(articleId);
    } else {
      newLiked.add(articleId);
    }
    setLikedArticles(newLiked);
  };

  const handleAddComment = () => {
    if (selectedArticle && newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        content: newComment,
        date: 'now',
        likes: 0,
      };
      
      setArticleComments(prev => ({
        ...prev,
        [selectedArticle.id]: [...(prev[selectedArticle.id] || []), comment]
      }));
      
      setNewComment('');
    }
  };

  const shareArticle = (platform: string) => {
    if (!selectedArticle) return;
    const text = `Check out this article: ${selectedArticle.title}`;
    const url = window.location.href;
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8 transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Newspaper className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Actualités</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Latest news and updates from our community</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Button */}
        <Button size="lg" variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          Filter
        </Button>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        variants={itemVariants}
        className="flex gap-2 mb-8 overflow-x-auto pb-2"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          All News
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-orange-600" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredArticles.map((article, idx) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-500/5 dark:to-red-500/5 hover:border-orange-300 dark:hover:border-orange-700 transition-all group cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${article.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                  
                  {/* Featured Badge */}
                  <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    FEATURED
                  </span>

                  {/* Category */}
                  <span className="absolute bottom-4 left-4 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-3 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {article.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 py-4 border-y border-gray-200 dark:border-gray-800 mb-4">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {article.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {article.date}
                    </div>
                    <div className="flex items-center gap-1">
                      📖 {article.readTime} min read
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(article.id);
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                          likedArticles.has(article.id)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        <Heart size={16} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                        {article.likes}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticle(article);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                      >
                        <MessageCircle size={16} />
                        {article.comments + (articleComments[article.id]?.length || 0)}
                      </button>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArticle(article);
                      }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-900 rounded-lg transition-colors"
                    >
                      <Share2 size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Regular Articles */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-6">Latest Articles</h2>
        <div className="space-y-4">
          {regularArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              whileHover={{ x: 5 }}
              className="flex gap-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              {/* Small Image */}
              <div
                className="w-32 h-32 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${article.image})` }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{article.date}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {article.description}
                </p>

                {/* Meta and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {article.author}
                    </span>
                    <span>📖 {article.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(article.id);
                      }}
                      className={`flex items-center gap-1 text-sm ${
                        likedArticles.has(article.id)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <Heart size={14} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                      {article.likes}
                    </button>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MessageCircle size={14} />
                      {article.comments + (articleComments[article.id]?.length || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Newspaper size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No articles found matching your criteria.</p>
        </motion.div>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedArticle(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-4xl w-full my-4 sm:my-8 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Fixed on top */}
            <div className="flex justify-end p-2 sm:p-4 absolute top-0 right-0 z-20">
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 sm:p-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 flex flex-col">
              {/* Article Image - Inside scroll container */}
              <div
                className="w-full h-40 sm:h-56 md:h-72 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${selectedArticle.image})` }}
              />

              {/* Article Content */}
              <div className="p-3 sm:p-4 md:p-6">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-800">
                  <span className="px-2 sm:px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs sm:text-sm font-semibold">
                    {selectedArticle.category}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <User size={14} className="sm:w-4 sm:h-4" />
                    <span className="truncate">{selectedArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={14} className="sm:w-4 sm:h-4" />
                    {selectedArticle.date}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    📖 {selectedArticle.readTime} min
                  </div>
                </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-950 dark:text-white mb-3 sm:mb-4">
                {selectedArticle.title}
              </h1>

              {/* Full Content */}
              <div className="prose dark:prose-invert max-w-none mb-6 sm:mb-8 prose-sm sm:prose-sm">
                {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-3 sm:py-4 border-y border-gray-200 dark:border-gray-800 mb-3 sm:mb-4">
                <span className="text-xs font-semibold text-gray-950 dark:text-white">Share:</span>
                <button
                  onClick={() => shareArticle('facebook')}
                  className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => shareArticle('twitter')}
                  className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  title="Share on Twitter"
                >
                  <Twitter size={18} className="sm:w-5 sm:h-5 text-blue-400" />
                </button>
                <button
                  onClick={() => shareArticle('linkedin')}
                  className="p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  title="Share on LinkedIn"
                >
                  <Linkedin size={18} className="sm:w-5 sm:h-5 text-blue-700" />
                </button>
              </div>

              {/* Engagement */}
              <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                <button
                  onClick={() => toggleLike(selectedArticle.id)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg transition-all text-xs sm:text-sm ${
                    likedArticles.has(selectedArticle.id)
                      ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Heart size={16} className="sm:w-4 sm:h-4" fill={likedArticles.has(selectedArticle.id) ? 'currentColor' : 'none'} />
                  <span className="hidden sm:inline">{selectedArticle.likes} likes</span>
                  <span className="sm:hidden">{selectedArticle.likes}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-950 dark:text-white mb-3 sm:mb-4">
                  Comments ({selectedArticle.comments + (articleComments[selectedArticle.id]?.length || 0)})
                </h3>

                {/* Comment Input */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
                  <input
                    type="text"
                    placeholder="Comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <Button
                    onClick={handleAddComment}
                    variant="primary"
                    className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-2"
                  >
                    <Send size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Post</span>
                    <span className="sm:hidden">Send</span>
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-2 sm:space-y-3">
                  {(articleComments[selectedArticle.id] || []).map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-950 dark:text-white">{comment.author}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{comment.date}</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </div>
  );
}
