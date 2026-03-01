export const WEALTH_QUOTES = [
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Wealth is the ability to fully experience life.", author: "Henry David Thoreau" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs.", author: "Zig Ziglar" },
  { text: "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.", author: "Ayn Rand" },
  { text: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Napoleon Hill" },
  { text: "Thoughts become things. If you see it in your mind, you will hold it in your hand.", author: "Bob Proctor" },
  { text: "Set a goal to achieve something that is so big, so exhilarating that it excites you and scares you at the same time.", author: "Bob Proctor" },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.", author: "Warren Buffett" },
  { text: "If you are born poor it's not your mistake, but if you die poor it's your mistake.", author: "Bill Gates" },
  { text: "It's fine to celebrate success, but it is more important to heed the lessons of failure.", author: "Bill Gates" },
  { text: "The most dangerous poison is the feeling of achievement. The antidote is to every evening think what can be done better tomorrow.", author: "Kobe Bryant" },
  { text: "Everything negative — pressure, challenges — is all an opportunity for me to rise.", author: "Kobe Bryant" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins" },
  { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "Be obsessed or be average.", author: "Grant Cardone" },
  { text: "Success is your duty, obligation, and responsibility.", author: "Grant Cardone" },
  { text: "Formal education will make you a living; self-education will make you a fortune.", author: "Jim Rohn" },
  { text: "The big money is not in the buying or selling, but in the waiting.", author: "Charlie Munger" },
];

export function getRandomQuote() {
  return WEALTH_QUOTES[Math.floor(Math.random() * WEALTH_QUOTES.length)];
}
