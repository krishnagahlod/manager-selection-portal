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

// Find a super_admin to mark as creator
const { data: admins } = await supabase
  .from('profiles')
  .select('id')
  .eq('role', 'super_admin')
  .limit(1);

if (!admins || admins.length === 0) {
  console.error('No super_admin found');
  process.exit(1);
}
const createdBy = admins[0].id;

// Deadline: 2 May 2026, 23:59 IST (= 18:29 UTC)
const deadline = new Date('2026-05-02T23:59:00+05:30').toISOString();

const announcement = `📢 IMPORTANT ANNOUNCEMENT

The assignment submission deadline is 2nd May.

However, if you plan to leave campus earlier, you can choose to submit your assignment in advance and opt for early interview slots starting from 28th April. The option to select this will be available in the submission form, which will be shared shortly.

Please plan your submissions accordingly. All the best!

═══════════════════════════════════════════

`;

const assignments = [
  {
    title: 'Assignment — Events & Operations (2026-27)',
    vertical: 'events_operations',
    description: announcement + `OBJECTIVE
1. To get a comprehensive understanding of the key vertical-specific topics in the Sustainability Cell, as well as important themes in global sustainability.
2. To independently ideate and plan the implementation of a few important initiatives and understand the potential challenges we would need to overcome.
3. To understand if the work in this vertical truly interests you, as the assignment is partly representative of what you will be working on during your tenure.

INSTRUCTIONS
1. There are 2 sections — Problem statements and new initiatives. Problem statements are key themes for the Sustainability Cell in the coming tenure that we want you to study and think deeply on. The new initiatives section is a topic you can ideate from scratch.

2. Each problem statement should not exceed 2 pages (document <= 5 pages) in content. Please use simple, but specific language to communicate your ideas. You can make drafts of your proposal/policy to showcase your ideation.

3. How to go about the assignment? You are encouraged to talk to relevant people wherever it is possible (avoid interactions with admin & operational bodies), conduct secondary research to quote specific ideas and draw from examples of bodies that work in Sustainability from across the world (student teams, global organisations, etc).

4. Please quote the source and a short sentence on what you took away from that resource, be it a person or a website, to help us understand the effort put in. Usage of AI is encouraged; however, calling it out wherever used would be highly appreciated.

5. Please note that this assignment is designed to be challenging and we absolutely do not expect you to have all the answers. Feel free to write "I don't know" to certain questions where you are unsure, but the overall topic interests you (most important). It is completely okay and will not be judged negatively.

═══════════════════════════════════════════

TOPICS: Please pick 2 out of the 4 problem statements

1. INTEGRATING SUSTAINABILITY IN INSTITUTE EVENTS
The institute now has a sustainable events policy. Based on the policy's recommendations, the events in the institute are to be looked at from the sustainability lens as well. Events on campus, from fests to small gatherings, often incur hidden environmental costs such as emissions from travel, energy use, material waste and more. As we aim to foster a greener campus, it's vital to critically assess these impacts and implement a system for continuous monitoring and improvement.

   a. Data Sources: Which specific sources (e.g., attendee travel, vendor energy usage, material consumption) will you target for data collection?
   b. Data Points: What precise data points will you collect from each source to measure the event's environmental impact?
   c. Permissions: What permissions or approvals are required to collect data from these sources and from which administrative channels will you obtain them?
   d. Collection Tools: Which tools or methods (digital surveys, sensors, manual logs, etc.) will you use to ensure accurate and timely data collection?
   e. Data Analysis: How will you analyze and compile the collected data to evaluate the event's sustainability performance?
   f. Feedback Integration: How will you integrate the audit findings into future event planning and establish ongoing governance for continuous improvement?

Your response should be concise yet comprehensive, providing actionable insights into both the audit process and the creation of an ongoing sustainability monitoring system.

2. FLEXIBLE MESS POLICY & FOOD WASTE REDUCTION
Food wastage in hostel messes is a persistent issue, often driven by students skipping meals without prior notice, leading to excess food being prepared and eventually wasted. One potential solution is to introduce a flexible mess policy, where students can opt out of meals in advance, receive some form of incentive and ensure that the caterer does not incur losses.

   a. If you were to design such a system for IIT Bombay, how would you approach it? What do you think are the key reasons behind food wastage in hostel messes and what constraints would you need to consider while designing this system (from the perspective of students, caterers and administration)?
   b. Based on this, how would your flexible mess system work in practice? Think about how students would opt out, what timelines would be required, how incentives would be structured and how the caterer would adjust accordingly.
   c. How would you ensure that students use the system responsibly while also maintaining fairness for all stakeholders?

You may also look at examples from other campuses, platforms, or systems that deal with demand prediction or opt-in/opt-out models. Are there any ideas you would like to adapt for IIT Bombay?

3. STRENGTHENING GREEN CUP
Green Cup is the Sustainability Cell's flagship inter-hostel sustainability competition. However, it has not yet seen strong engagement from hostel residents and councils, with gaps in awareness, participation and on-ground execution.

   a. You are required to analyse the current framework (through ground works, observation and informal interactions where possible) and think about how it can be strengthened to become a more effective and widely adopted initiative.
   b. Based on your understanding, what do you think are the key reasons why Green Cup has not seen strong engagement so far? You may think in terms of awareness, incentives, structure, communication, or ownership.
   c. How would you modify or rethink the current framework to address these gaps? What changes would you make to make it more engaging, intuitive and meaningful for participants?
   d. In addition, how would you increase participation from hostel residents and ensure active involvement from hostel councils? How would you communicate what Green Cup is, why it matters and how students can contribute in a way that actually resonates with them?
   e. The Sustainability Cell now has Sustainability Secretaries in hostels as representatives. How would you leverage them to strengthen the Green Cup? Beyond this, how would you collaborate with them for other sustainability initiatives across the year?

4. FLAGSHIP EVENT FOR SUSTAINABILITY CELL
The Sustainability Cell aims to host a flagship event (or a set of events on the same day) that stands out on campus. This could either be an event that drives high participation from students, or one that is more focused and unique, but creates a strong impact on the image and positioning of the Sustainability Cell and IIT Bombay. The challenge lies in designing something that is not just another sustainability-related event, but one that is engaging, memorable and meaningful.

   a. If you were to design such an event, what would your concept look like? What makes it distinct from typical sustainability events and what kind of impact are you aiming for (high participation, strong brand/image impact, or a balance of both)?
   b. Based on your chosen direction, how would you ensure that the event achieves its goal? What elements would you include to either maximise participation or create a high-impact, high-quality experience?
   c. What would your high-level plan for executing this event look like? You may think in terms of timeline, key steps and resources required to bring the idea to life.
   d. Finally, how would you publicise this event? What channels, messaging and strategies would you use to ensure it reaches the right audience and generates the intended impact?
   e. Given that there are a lot of other student bodies on campus that work on sustainability, ideate some collabs with them to maximize the reach, scale, bandwidth and impact eventually.

═══════════════════════════════════════════

NEW INITIATIVES
Please ideate on any 1 initiative of your own. One idea to help you get started could be related to increasing sustainability on campus. However, this is purely a guideline and you are free to ideate. Please focus on what?, why?, how?, when?, where?. Also, think about what things could go wrong and what you will do then? Additional topics are entirely up to you. Great and ambitious ideas are always welcome.

═══════════════════════════════════════════

EVALUATION CRITERIA
1. Quality of content — 50%
   a. Depth and understanding of on-ground execution in the Institute — 20%
   b. Understanding of potential roadblocks and feasibility of solutions — 20%
   c. Creativity of ideas and unique ways of implementation — 10%
2. Effort: number of scenarios covered and stakeholders considered — 35%
3. Presentation: neatness, readability, flow of content — 10%
4. Details of the small things, such as where you will get a table from? How will you book the venue? Etc. — 5%

Please remember that the length of content is not at all a criterion — even a half-page, well-thought-out initiative will work just as well. We understand that there is a shortage of time and hence we are not expecting many additional groundworks. However, time will always be a constraint and this will be a way for us to judge you in that situation, so please spend sufficient time independently thinking about this assignment.

We hope this assignment is interesting and nudges you to continue exploring this domain. All the best!`,
  },
  {
    title: 'Assignment — Projects & Policies (2026-27)',
    vertical: 'projects_policies',
    description: announcement + `OBJECTIVE
1. To get a comprehensive understanding of the key vertical-specific topics in the Sustainability Cell, as well as important themes in global Sustainability.
2. To independently ideate and plan the implementation of a few important initiatives, and understand the potential challenges we would need to overcome.
3. To understand if the work in this vertical truly interests you, as the assignment is partly representative of what you will be working on during your tenure.

INSTRUCTIONS
1. There are 2 sections — Problem statements and new initiatives. Problem statements are key themes for the Sustainability Cell in the coming tenure that we want you to study and think deeply on. The new initiatives section is a topic you can ideate from scratch.

2. Each problem statement should not exceed 2 pages (document <= 6 pages) in content. Please use simple, but specific language to communicate your ideas. You can make drafts of your proposal/policy to showcase your ideation.

3. How to go about the assignment? You are encouraged to talk to relevant people wherever it is possible (avoid interactions with admin & operational bodies), conduct secondary research to quote specific ideas and draw from examples of bodies that work in Sustainability from across the world (student teams, global organisations, etc).

4. Please quote the source and a short sentence on what you took away from that resource, be it a person or a website, to help us understand the effort put in. Usage of AI is encouraged; however, calling it out wherever used would be highly appreciated.

5. Please note that this assignment is designed to be challenging and we absolutely do not expect you to have all the answers. Feel free to write "I don't know" to certain questions where you are unsure, but the overall topic interests you (most important). It is completely okay and will not be judged negatively.

═══════════════════════════════════════════

TOPICS: Please pick 2 out of the 4 problem statements

1. COLLABORATIONS WITH INDUSTRY AND ACADEMIA
The domain of Sustainability is intrinsically multidisciplinary. Collaboration is extremely important and there is a huge opportunity for it. This could include CXOs, leading sustainability professionals/firms, government bodies, professors, alumni, etc. It remains somewhat of an untapped space for the Sustainability Cell.

   a. If you were given the lead to strengthen the Cell's relations and collaborations with industry and academia, how would you go about it? What would be your broad action plan? Feel free to be ambitious.
   b. Over the past year, the Cell has observed that companies are increasingly interested in getting their technological or sustainability-related problems solved by IIT students as well as fund initiatives through CSR. Which companies would you approach in this regard and how would you facilitate the solving of their problems? How would you structure this engagement and ensure that the Sustainability Cell becomes a valuable long-term partner for such organisations?
   c. As part of your outreach, you are required to create a PITCH DECK that the Sustainability Cell could use while approaching companies. This pitch should aim towards initiatives such as case competitions, event sponsorships and CSR collaborations. What key elements would you include and how would you position the Cell to make this compelling for companies? Create the pitch deck. You may choose to tailor this for a specific type of company or keep it general.
   d. Finally, how would you expand the Cell's influence beyond IIT Bombay? What can be done to increase our reach with NGOs, CSR initiatives, policy forums, youth organisations and government missions?

2. NET ZERO ROADMAP
The idea of achieving net zero campuses is gaining momentum across institutions globally, with universities creating structured roadmaps spanning areas such as energy, waste, water, mobility and procurement. IIT Bombay has several sustainability initiatives and policies in place, along with broader institutional vision documents, but there is an opportunity to bring these together into a more cohesive and structured Net Zero Roadmap.

   a. If you were given the responsibility to contribute to shaping such a roadmap, how would you go about it? What would be your broad approach to defining net zero in the context of IIT Bombay and what key sectors or focus areas would you include?
   b. As part of your approach, you are encouraged to look at net zero or sustainability roadmaps from other universities or institutions. Which institutions would you refer to and what are some specific ideas or structural elements you would like to adapt for IIT Bombay from these institutes? How would you adapt these ideas to suit the campus context?
   c. Based on your understanding, how would you structure the roadmap? You may think in terms of phases, priorities, or sector-wise breakdowns. What kinds of interventions (for example: infrastructure, policy, behavioural) would you include across these sections and how would you organise them in a simple and clear framework?
   d. While attempting this, what are some questions, gaps, or uncertainties you encounter? What is something you would like to explore further if you were to continue working on this problem?

3. IMPROVING INSTITUTE EVENT & GREEN FEST POLICIES
IIT Bombay has an Institute Event Sustainability Policy, which is currently in the process of being refined and improved. These policies aim to make campus events more structured, accountable and sustainable. However, for such policies to be effective, they must not only be well-designed but also practical to implement on ground.

   a. You are required to go through the document and analyse them from both a policy and execution perspective. Based on your understanding, what do you think are the key objectives of these policies? Look out for areas that seem unclear, incomplete, or difficult to implement — essentially what are the gaps in the current policies?
   b. What specific improvements would you suggest to strengthen these policies looking at the perspective for a second edition of these policies? These could include additions, modifications, or removal of certain aspects. Focus on making your suggestions as clear and actionable as possible.
   c. Pick one of your suggestions and explain how it would actually be implemented during an event. What would this look like on ground and what steps would be required to ensure it is followed effectively?
   d. You may also refer to practices followed by other colleges, festivals, or organisations. Are there any ideas or systems you would like to adapt for IIT Bombay?

4. FLAGSHIP EVENT FOR SUSTAINABILITY CELL
The Sustainability Cell aims to host a flagship event (or a set of events on the same day) that stands out on campus. This could either be an event that drives high participation from students, or one that is more focused and unique, but creates a strong impact on the image and positioning of the Sustainability Cell and IIT Bombay. The challenge lies in designing something that is not just another sustainability-related event, but one that is engaging, memorable and meaningful.

   a. If you were to design such an event, what would your concept look like? What makes it distinct from typical sustainability events and what kind of impact are you aiming for (high participation, strong brand/image impact, or a balance of both)?
   b. Based on your chosen direction, how would you ensure that the event achieves its goal? What elements would you include to either maximise participation or create a high-impact, high-quality experience?
   c. What would your high-level plan for executing this event look like? You may think in terms of timeline, key steps and resources required to bring the idea to life.
   d. Finally, how would you publicise this event? What channels, messaging and strategies would you use to ensure it reaches the right audience and generates the intended impact?
   e. Given that there are a lot of other student bodies on campus that work on sustainability, ideate some collabs with them to maximize the reach, scale, bandwidth and impact eventually.

═══════════════════════════════════════════

NEW INITIATIVES
Please ideate on any 1 initiative of your own. One idea to help you get started could be related to increasing sustainability on campus. However, this is purely a guideline and you are free to ideate. Please focus on what?, why?, how?, when?, where?. Also, think about what things could go wrong and what you will do then? Additional topics are entirely up to you. Great and ambitious ideas are always welcome.

═══════════════════════════════════════════

EVALUATION CRITERIA
1. Quality of content — 50%
   a. Depth and understanding of on-ground execution in the Institute — 20%
   b. Understanding of potential roadblocks and feasibility of solutions — 20%
   c. Creativity of ideas and unique ways of implementation — 10%
2. Effort: number of scenarios covered and stakeholders considered — 35%
3. Presentation: neatness, readability, flow of content — 10%
4. Details of the small things, such as who you will approach for a specific data point collection? How will you book the venue? Etc. — 5%

Please remember that the length of content is not at all a criterion — even a half-page, well-thought-out initiative will work just as well. We understand that there is a shortage of time and hence we are not expecting many additional groundworks. However, time will always be a constraint and this will be a way for us to judge you in that situation, so please spend sufficient time independently thinking about this assignment.

We hope this assignment is interesting and nudges you to continue exploring this domain. All the best!`,
  },
  {
    title: 'Assignment — Web & Design (2026-27)',
    vertical: 'web_design',
    description: announcement + `OBJECTIVE
1. To get a comprehensive understanding of the key vertical-specific topics in the Sustainability Cell, as well as important themes in global Sustainability.
2. To independently ideate and plan the implementation of a few important initiatives, and understand the potential challenges we would need to overcome.
3. To understand if the work in this vertical truly interests you, as the assignment is partly representative of what you will be working on during your tenure.

INSTRUCTIONS
1. There are 2 sections — Problem statements and new initiatives. Problem statements are key themes for the Sustainability Cell in the coming tenure that we want you to study and think deeply on. The new initiatives section is a topic you can ideate from scratch.

2. Each problem statement should not exceed 2 pages (document <= 5 pages) in content. Please use simple, but specific language to communicate your ideas.

3. How to go about the assignment? You are encouraged to talk to relevant people wherever it is possible (avoid interactions with admin & operational bodies), conduct secondary research to quote specific ideas and draw from examples of bodies that work in Sustainability from across the world (student teams, global organisations, etc).

4. Please quote the source and a short sentence on what you took away from that resource, be it a person or a website, to help us understand the effort put in. Usage of AI is encouraged; however, calling it out wherever used would be highly appreciated.

5. Please note that this assignment is designed to be challenging and we absolutely do not expect you to have all the answers. Feel free to write "I don't know" to certain questions where you are unsure, but the overall topic interests you (most important). It is completely okay and will not be judged negatively.

═══════════════════════════════════════════

TOPICS: Please pick 2 out of the 4 problem statements

1. W — DIGITAL INFRASTRUCTURE & PROTOTYPING
The Web vertical has the potential to move beyond content and become the backbone of the Sustainability Cell by building digital systems such as the website, dashboards and data platforms. These systems can enable initiatives like the Green Cup, improve accessibility of sustainability data and streamline internal workflows. However, current challenges include a lack of continuity, overdependence on individuals and difficulty in execution when technical blockers arise.

   a. If you were given the responsibility to develop the Cell's digital infrastructure, what would be your vision for the website and associated platforms? What kind of systems (e.g., dashboards, portals, workflows) would you aim to build and how would they contribute to making the website a central hub for sustainability on campus?
   b. Choose one system (for example, a Green Cup Dashboard, Sustainability Data Portal, or website revamp) and attempt to build a BASIC PROTOTYPE using any tools (AI tools, no-code platforms, or coding). Please share your approach to building this, including the tools used and the steps you followed.
   c. While working on this prototype, you may face situations where you are unsure how to proceed or get stuck. Please describe any such challenges you faced (or anticipate facing) and how you dealt with them or would go about resolving them.
   d. The Web vertical will work with a team of conveners. How would you break down such a project into smaller tasks and delegate them effectively? How would you ensure that conveners not only contribute but also learn and develop skills through this process, while avoiding overdependence on a single individual?

2. D — FRESHERS OUTREACH: NEWSLETTER & ENGAGEMENT SYSTEM
The Sustainability Cell has an opportunity to engage incoming freshers early on and shape how they perceive sustainability on campus. Communication here needs to go beyond information and become something that is engaging, relatable and action-driven. At present, a key challenge is that sustainability often feels abstract or low-priority to freshers and initial outreach does not always translate into meaningful engagement.

   a. If you were to design a freshers' newsletter, how would you approach it? What kind of content, tone and visual style would make it interesting enough for a fresher to actually read and explore further? How would you ensure that it reflects the identity of the Sustainability Cell while remaining accessible and engaging?
   b. Beyond just the newsletter, how would you encourage freshers to take action after reading it? Think about how you would design prompts, challenges, or pathways that push them to explore sustainability on campus in a simple and intuitive way.
   c. As part of this, design a system to track and reward exploration, such that students who engage with sustainability initiatives can be recognised during orientation. How would this system work in practice and how would you ensure it remains fair, simple and scalable?
   d. You may choose to create a sample layout, mockup or content draft for the newsletter (optional). Please describe your approach and the decisions you made while designing it.
   e. While working on this, what challenges did you face (or anticipate), especially in capturing attention and driving action? How would you address them?

3. C — COLLABORATIONS & OUTREACH
The domain of Sustainability is intrinsically multidisciplinary. Collaboration is extremely important and there is a huge opportunity for it. This could include CXOs, leading sustainability professionals/firms, Government bodies, professors, alumni, etc. It is a huge untapped opportunity for the Sustainability Cell.

   a. If you were given the lead to strengthen the Cell's relations and collaborations with the industry and with academia, how would you go about it? What would be your broad action plan? Feel free to be ambitious.
   b. This year the cell noticed that companies want to get their technological problems solved via IIT students. Which companies would you approach in this regard and how would you facilitate the solving of their problems? How would you plan on strengthening this relationship and making the Sustainability Cell a valuable partner? Can you create a pitch-deck for one such company to establish a collaboration with them.
   c. We also noticed that events such as invite-only panel discussions and fireside chats are more suited to the cell than mass audience events. Please prepare a list of people that you would start reaching out to if you were leading this initiative. You are free to ideate new events along these guardrails.
   d. How to expand the Cell's influence outside IITB — what can be done to increase our reach with NGOs, CSR, Policy forums, youth organisations and government missions?

4. C — USING "ZUZU" FOR ENGAGEMENT & BEHAVIOUR CHANGE (DESIGN & MEDIA)
The Sustainability Cell has its own mascot, ZUZU, which has the potential to become a strong tool for communication, engagement and behaviour change on campus. However, mascots often risk becoming underutilised or repetitive if not used thoughtfully. There is an opportunity to shape Zuzu into a recognisable and relatable identity that improves the Cell's visibility while also nudging students towards more sustainable actions.

   a. If you were to define Zuzu as a character, how would you shape its personality, tone and identity? What would make it relatable and appealing to students across campus?
   b. Building on this, where and how would you use Zuzu across the campus ecosystem? You may think in terms of digital platforms, physical spaces, events, or everyday nudges. What kinds of use cases would make Zuzu consistently visible without becoming repetitive or ignored?
   c. Pick 2-3 such use cases and explain how Zuzu would help drive a SPECIFIC BEHAVIOUR CHANGE (for example, reducing waste, saving electricity, or improving participation in initiatives). How would this be designed to ensure that students actually respond to it?
   d. How would you use Zuzu to improve the VISIBILITY of the Sustainability Cell over time?
   e. You may choose to create SAMPLE VISUALS, CONCEPTS, OR CONTENT PIECES (bonus). Please describe your approach and the decisions you made while designing them.
   f. While working on this, what challenges did you face (or anticipate), especially in maintaining originality and long-term engagement? How would you address them?

═══════════════════════════════════════════

NEW INITIATIVES
Please ideate on any 1 initiative of your own. One idea to help you get started could be related to increasing sustainability on campus. However, this is purely a guideline and you are free to ideate. Please focus on what?, why?, how?, when?, where?. Also, think about what things could go wrong and what you will do then? Additional topics are entirely up to you. Great and ambitious ideas are always welcome.

═══════════════════════════════════════════

EVALUATION CRITERIA
1. Quality of content — 35%
2. Effort: number of scenarios covered and stakeholders considered — 35%
3. Presentation: neatness, readability, flow of content — 50%
4. Details of the small things, such as who you will approach for a specific data point collection? How will you book the venue? Etc. — 5%

Please remember that the length of content is not at all a criterion — even a half-page, well-thought-out initiative will work just as well. We understand that there is a shortage of time and hence we are not expecting many additional groundworks. However, time will always be a constraint and this will be a way for us to judge you in that situation, so please spend sufficient time independently thinking about this assignment.

We hope this assignment is interesting and nudges you to continue exploring this domain. All the best!`,
  },
];

for (const a of assignments) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      title: a.title,
      description: a.description,
      vertical: a.vertical,
      deadline,
      created_by: createdBy,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error(`FAIL  ${a.title}: ${error.message}`);
  } else {
    console.log(`CREATED  ${a.title}  (${a.vertical})`);
  }
}

console.log('\nDeadline for all:', new Date(deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
