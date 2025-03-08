Concept: Send physical letters in a few click without a printer. [PostMail.ai](http://postmail.ai)
- Use case
  You don’t have a printer but need to send a letter ? Do it in a few click. Draw up your letter with the assistant, you can start from the picture of a letter you want to answer to. Once your letter is good for you, send it in a click
- Technical
  The UX would be in this vein:
  A wizard that uses a multimodal agent that guides the user and asks for any missing info. The frontend would have pre coded modules, such as sender address if missing, or confirm and edit content, or add you signature. Backend ai determines what next step is to be shown with the context on BE updated with each step. Then a PDF is generated (user can prompt to make modifications, cannot edit document directly). Once user is happy he goes to payment with stripe checkout. Then when user pays letter is sent through the Pingen API. We want the most seamless UI possible with a bare minimum number of clicks and steps.

How could the LLM be used to figure out the next steps in the wizzard. Lets take a case where the user takes a picture of a letter from a bank account fee bump. User takes a picture and asks to cancel the account. Lets consider all the possible wizzard steps
- Content where one can read the content of the letter and prompt for changes
- Sender: address of sender
- Receiver: address of receiver
- Signature.

In our scenario wizzard can infer sender and receiver from the letter, prefills them and doesnt show them as direct steps, only editable at the end of wizzard that shows the recap before pdf gen. In our scenario our wizard would show content step and signature step. How could we implement such logic with next.js