import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split('\n').forEach((l) => {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const updates = [
  {
    email: '24b4244@iitb.ac.in',
    name: 'Amartya Rawat',
    phone: '9892917237',
    department: 'ESED',
    year_of_study: 2,
    verticals: ['projects_policies', 'events_operations', 'web_design'],
    form_responses: {
      roll_number: '24b4244',
      personal_email: 'amartyrawat14@gmail.com',
      hostel_number: '18',
      cpi: '6.53',
      statement_of_purpose: `My motivation to join the Sustainability Cell stems from a desire to turn existing initiatives into a self-sustaining ecosystem. The Green Cup and Winter Projects show a strong foundation. I want to build the "connective tissue" between projects and operations.

Personally, I want to deeply learn how campus sustainability works like managing waste, water, energy, and events. I want to conduct workshops and spread awareness in ways that actually stick. And I want to implement unique, new policies that no one has tried before. In return, I will gain leadership skills, hands-on systems knowledge, and the ability to drive real change.

For Projects & Policies:
I am genuinely interested in how campus rules are made and how one time ideas can become lasting systems. I want to learn by doing auditing past initiatives, understanding what works, and helping build simple, repeatable playbooks. I will give my time and energy to research, document, and coordinate with the team.

For Events & Operations:
I enjoy running things on the ground. I want to learn how to plan workshops, manage logistics, and track waste and resources at events. I am ready to handle pressure, work late, and make sure things run smoothly. I will bring energy to awareness campaigns and make sustainability visible and fun.

For Web and Design:
I want to join Web & Design because good design helps people understand why sustainability matters. I will learn to create posts and manage social media that inform and engage. My goal is to make sure every student sees the value in initiatives like the Green Cup and Sustainium not just as events, but as opportunities to learn and act.`,
      liked_initiatives: `I think the three most impactful and well-executed initiatives by the Cell are the Green Cup, the Sustainium Case Competition, and the Sustainability Winter Projects.

· Green Cup (Gamified Behavior Change): As the Cell's flagship competition, it brilliantly leverages hostel rivalry in General championship to drive real behavioral change. Instead of just passive awareness, it actively incentivizes hostels to reduce energy and water consumption, and improve waste segregation, turning a serious institutional goal into an engaging, community driven challenge. It gamifies sustainability, making it competitive and fun.

· Sustainium (Industry-Led Innovation): This competition bridges the gap between academic knowledge and real-world problem-solving. The 2025 edition, in collaboration with Elima, required participants to design a high-precision system to identify and sort chemically similar plastics from e-waste. By tackling an industry partner's specific challenge, it pushes students to build practical, data-driven solutions and a truly circular mindset.

· Sustainability Winter Projects (Hands-On Skills): This is a powerful model for active learning, offering four project tracks in high-demand fields like Climate Data Analytics and ESG Reporting. This structure provides invaluable, resume-building experience and equips students with the exact skills needed for careers in the climate tech and sustainability sectors.`,
    },
  },
  {
    email: '24b3036@iitb.ac.in',
    name: 'Ishika Rawat',
    phone: '9175909599',
    department: 'Economics',
    year_of_study: 2,
    verticals: ['projects_policies'],
    form_responses: {
      roll_number: '24b3036',
      personal_email: 'ishika005@icloud.com',
      hostel_number: '17',
      cpi: '7.6',
      statement_of_purpose: `The feeling of seeing change on the ground, not just on paper, is what draws me to the Sustainability Cell in the first place.

Sustainability initiative was a question I kept asking myself, what does it actually take to move from an idea to something real? From point A to Z, what lies in between? The Sustainability Cell gave me a glimpse of that answer.

The community has people who chose to care, people who stayed curious, who asked "why not?" instead of "why bother?"

I have always been drawn to spaces that celebrate that spirit, the startup culture, the messiness of innovation, the courage to think differently without the weight of rigid conventions holding you back and gives you a challenge.

Managing real projects, working with diverse teams, and navigating institutional processes will sharpen my time management, build my leadership instincts, and develop the soft skills

The Projects and Policies vertical feels like the right place for me to do exactly that. It is the Think Tank, brainstorm ideas, discover the impact, as well the main aspect which is feasibility. It's the no bluff attitude and getting into the clear details.

The thought of collaborating with Professors, GESH, and institutional bodies, is something I genuinely look forward to. And drafting a proposal? I have never done it before. But that is precisely what excites me.

Its purpose about making students more aware, more engaged, and more invested in the world around them. When you bridge that gap between awareness and action, when a student understands why sustainability matters and then sees it manifested in their own campus, something shifts. And I want to be part of that shift.

Because at the end of the day, it is about knowing that my time at IIT Bombay meant something beyond the classroom, that I was part of something that made this institution better, more responsible, and more worthy of the recognition it deserves.

That is the kind of impact I want to leave behind.`,
      liked_initiatives: `1. Carbon Footprint Assessment
What fascinated me about this project was its scale and honesty. Sustainability Cell partnered with faculty from Earth Sciences and Chemistry to map the entire campus's carbon emissions and found that 95% came from Scope 2 sources (electricity). Most organisations avoid this kind of uncomfortable data. Sustainability Cell went looking for it. That intellectual courage is what drew me in.

2. Airathon Pan India Air Quality Competition
This one stood out because it went beyond the campus. In collaboration with the Institute Technical Council, Sustainability Cell ran a nationwide competition focused on improving air quality in Mumbai. It showed that Sustainability Cell doesn't just think about IITB's backyard, it thinks about the city it sits in. That outward looking ambition is something I deeply respect.

3. EV Buggy Optimization
Simple idea, real impact. Sustainability Cell strategically repositioned EV buggy stops near the Lecture Hall Complex and student residential zones to cut idle time and improve battery efficiency. What I liked was the approach, no grand announcement, just quiet problem solving. It reminded me that sustainability often lives in the details, not the headlines.`,
    },
  },
  {
    email: '24b0367@iitb.ac.in',
    name: 'Pranjal Uniyal',
    phone: '9548917932',
    department: 'Chemical Engineering',
    year_of_study: 2,
    verticals: ['projects_policies'],
    form_responses: {
      roll_number: '24B0367',
      personal_email: 'pranjal.uniyal07@gmail.com',
      hostel_number: '5',
      cpi: '8.4',
      statement_of_purpose: `As a chemical engineering student having done almost half of my core engineering courses the massive importance and impact of energy efficiency and zero waste has amazed me and piqued my interest in this domain. My interest in sustainability sector originated while participating in case competitions and working as part of a tech team (TorqueX), where I realized how sustainability is no longer just an environmental initiative but has become a fundamental basis in business and operations and how ESG and net zero play a pivotal role in shaping polices in all domains. It inspired me to actively help guide the policy, technical and behavioral changes needed within our institute to raise sustainability awareness and build towards a net zero campus. Having explored the initiatives and implementations of the Sustainability Cell I find that it perfectly aligns with my interest which made me decide to apply for the position of a Manager.

I applied for the Projects & Policies vertical because of my past experiences in the institute. During my time in the tech team, I was required to do a lot of literature review and compile various reports, this made me adept in drafting reports. I also have some experience with outreach and networking with companies due to my work as a coordinator in MI. My background makes this vertical the ideal starting point to contribute immediately to the Cell.

Equally important is the fact that the position of a Manager at the Sustainability Cell offers professional and personal growth. It provides an invaluable opportunity to build my skills in tackling open ended problems, managing diverse stakeholders and implementing effective and result driven solutions which will definitely help me in the future and it does so while aligning with my interests. Also on a personal level this gives me a chance to leave an impact. Knowing that the changes I help bring today will continue to benefit the institute even after I graduate is deeply fulfilling.`,
      liked_initiatives: `Out of all the initiatives of the Sustainability Cell these are the ones which I personally liked the most:

Waste Data Display on Board in messes - I first noticed this in my first year in the Hostel 16 mess. The numbers which I saw made me realize how 'much' food goes to waste with every meal, that too everyday. Every time I glanced at it, there was a feeling of disappointment in me and the thought always occurred to me that something should be done. I like this initiative a lot because it does not involve many resources and isn't technology heavy rather is very simple but the impact it creates on the stakeholder is huge. If the thought of guilt about wasting food and changing such behavior crossed the minds of even half of the people who look at the board, then the purpose is served. This method is also more impactful than orientations and talks because rather than someone else sharing their views and do and don'ts it makes one realize the importance of behavioral change via their own actions.

Carbon Footprinting - I appreciate how it clearly quantifies the progress throughout the year. Because it breaks the data down scope by scope, it makes it much easier to pinpoint operational bottlenecks and draft efficient policies to fix them. These numbers also give the Cell a solid baseline for setting future targets. Beyond the technical benefits, watching that footprint go down is a testament to the team's hard work. Seeing real, improving numbers is incredibly motivating and keeps the momentum going toward a net-zero campus.

Green Cup: I was really fascinated when I came across this. I had heard about the GC culture at IIT Bombay but I thought it was only limited to sports and culturals. Hosting a GC where students participate rigorously to make their hostel win by reducing the carbon foot print of their respective hostel is a very efficient and clever way of instilling a sense of responsibility towards sustainability. This makes the students; who are one of the most important stakeholders; contribute towards a net zero campus voluntarily. The Green Cup harnesses the emotion of hostel pride and belonging and invests it towards sustainability and net zero, I think this is killing two birds with one stone, it spreads awareness as well as makes people contribute towards the Sustainability Cell's cause at the largest scale.`,
    },
  },
];

const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

for (const u of updates) {
  let userId;
  let action;
  const existing = users?.users?.find((usr) => usr.email === u.email);

  if (existing) {
    userId = existing.id;
    action = 'UPDATE';
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'SusCell@2026',
      email_confirm: true,
      app_metadata: { role: 'candidate' },
    });
    if (createError) {
      console.error('FAIL: ' + u.name + ' - ' + createError.message);
      continue;
    }
    userId = newUser.user.id;
    action = 'CREATE';
  }

  await supabase.from('profiles').update({
    full_name: u.name,
    phone: u.phone,
    department: u.department,
    year_of_study: u.year_of_study,
    form_responses: u.form_responses,
    role: 'candidate',
  }).eq('id', userId);

  await supabase.from('candidate_verticals').delete().eq('candidate_id', userId);
  await supabase.from('candidate_verticals').insert(u.verticals.map((v) => ({ candidate_id: userId, vertical: v })));

  console.log(`${action}  ${u.name.padEnd(20)}  ${u.email.padEnd(25)}  [${u.verticals.join(', ')}]`);
}
