import ReactMarkdown from "react-markdown";

function SectionCard({ title, content }) {

    return (

        <div className="border rounded-xl p-5 bg-gray-50">

            <h3 className="text-xl font-semibold mb-4">
                {title}
            </h3>

            <div className="whitespace-pre-wrap leading-7">

                <ReactMarkdown>
                    {content || "No information available."}
                </ReactMarkdown>

            </div>

        </div>

    );

}

export default SectionCard;