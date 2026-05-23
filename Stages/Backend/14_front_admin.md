## To Fix
while the Api testing all endpoint works perfect 
but have a problem with the history 
i was using `ConversationalRetrievalChain` that only get the question of the user and retrieve 
and make a template that has the question and context to pass to the llm to generate 

i have to find a way to add the history i get from the database and control the history window to 5 

later i will add different memory and let the admin in the chatbot creation select of them

## Fixed 

solve the history problem by overriding tthe `ConversationalRetrievalChain` tempelate 

by addin qa_template that get 3 inputs  (question - context - chat_history) then pass it to the `ConversationalRetrievalChain`

with the keyword `combine_docs_chain_kwargs` and add it in the component

also make the history last 7 messages by one number  it add paris of messages human+ai 

-1 -> human+ai + question  -> 3 messages
-2 -> human+ai + human+ai + question  -> 5 messages
-3 -> human+ai + human+ai + human+ai + question  -> 7 messages
...

