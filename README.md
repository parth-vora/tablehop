[tablehop] - tabletop.vercel.app 

A restaurant & booking management system with the following features: 

Guests: 
- Book an avaliable slot as a restaurant. 
- Join the waitlist if none are avaliable. 
- Cancel a booking. 
- Accept a confirmation to get off waitlist if a table opens up. 
- AI Chatbot to help discover what restaurant to select and avaliability. For top diners, the chatbot can make the reservation for you. 

Hosts:
- Add a restaurant. 
- Cancel bookings. 
- View reservations / waitlists for each day. 

This application leverages the following: 

Vercel: 
- Next.js app: The pages, actions and route handlers
- Workflows: Triggers waitlist action to offer slot to next person on waitlist, wait 60s, then continue. 
- AI SDK / Gateway: AI Agent, Off waitlist generated message, Gemini + ChatGPT model calls. 
- v0: UI Design for pixel-themed restaurant site. 
- OIDC Token: Private access into GCP via Workload Identity Federation
- Flags: Used for canary / blue-green deployements to roll out features to select users (top-diners get the AI booking agent)

Google Cloud
- Firestore: Database for guest info, reservations, and restaurants. 
- Cloud Run: The booking api is hosted here. 
