import { useEffect, useRef, useState } from "react";
import {
    Pencil,
    Eraser,
    Undo2,
    Trash2,
    Type,
    Square,
    Circle,
    Minus,
    ArrowUpRight,
} from "lucide-react";

const AnswerDrawingPad = ({
    value,
    onChange,
    disabled = false,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const [tool, setTool] = useState("pen");
    const [brushSize, setBrushSize] = useState(3);
    const [textSize, setTextSize] = useState(22);

    const [isDrawing, setIsDrawing] = useState(false);

    const [startPoint, setStartPoint] = useState(null);
    const [currentPoint, setCurrentPoint] = useState(null);

    const [history, setHistory] = useState([]);

    const [textInput, setTextInput] = useState(null);
    const [textValue, setTextValue] = useState("");

    // =========================================================
    // CANVAS SIZE
    // =========================================================

    const getCanvasSize = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return {
                width: 900,
                height: 500,
            };
        }

        return {
            width: canvas.width,
            height: canvas.height,
        };
    };

    // =========================================================
    // INITIALIZE CANVAS
    // =========================================================

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        canvas.width = 1000;
        canvas.height = 550;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111827";

        if (value) {
            const image = new Image();

            image.onload = () => {
                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.fillStyle = "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            };

            image.src = value;
        }

        setHistory([]);
    }, []);

    // =========================================================
    // GET POSITION
    // =========================================================

    const getPosition = (event) => {
        const canvas = canvasRef.current;

        const rect = canvas.getBoundingClientRect();

        const scaleX =
            canvas.width / rect.width;

        const scaleY =
            canvas.height / rect.height;

        return {
            x:
                (event.clientX - rect.left) *
                scaleX,

            y:
                (event.clientY - rect.top) *
                scaleY,
        };
    };

    // =========================================================
    // SAVE HISTORY
    // =========================================================

    const saveHistory = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const snapshot = canvas.toDataURL(
            "image/png"
        );

        setHistory((previous) => [
            ...previous.slice(-19),
            snapshot,
        ]);
    };

    // =========================================================
    // EXPORT CANVAS
    // =========================================================

    const updateParent = () => {
        const canvas = canvasRef.current;

        if (!canvas || !onChange) return;

        onChange(
            canvas.toDataURL("image/png")
        );
    };

    // =========================================================
    // DRAW PEN
    // =========================================================

    const drawPen = (point) => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        ctx.strokeStyle = "#111827";
        ctx.lineWidth = brushSize;

        ctx.lineTo(
            point.x,
            point.y
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
            point.x,
            point.y
        );
    };

    // =========================================================
    // ERASER
    // =========================================================

    const drawEraser = (point) => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = brushSize * 6;

        ctx.lineTo(
            point.x,
            point.y
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
            point.x,
            point.y
        );
    };

    // =========================================================
    // DRAW SHAPE PREVIEW
    // =========================================================

    const drawShape = (
        ctx,
        shape,
        start,
        end
    ) => {
        ctx.beginPath();

        ctx.strokeStyle = "#111827";
        ctx.lineWidth = brushSize;

        if (shape === "rectangle") {
            const width =
                end.x - start.x;

            const height =
                end.y - start.y;

            ctx.strokeRect(
                start.x,
                start.y,
                width,
                height
            );
        }

        if (shape === "circle") {
            const radius =
                Math.sqrt(
                    Math.pow(
                        end.x - start.x,
                        2
                    ) +
                    Math.pow(
                        end.y - start.y,
                        2
                    )
                );

            ctx.arc(
                start.x,
                start.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }

        if (shape === "line") {
            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();
        }

        if (shape === "arrow") {
            const angle = Math.atan2(
                end.y - start.y,
                end.x - start.x
            );

            const headLength = 15;

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                end.x,
                end.y
            );

            ctx.lineTo(
                end.x -
                    headLength *
                        Math.cos(
                            angle -
                                Math.PI / 6
                        ),

                end.y -
                    headLength *
                        Math.sin(
                            angle -
                                Math.PI / 6
                        )
            );

            ctx.moveTo(
                end.x,
                end.y
            );

            ctx.lineTo(
                end.x -
                    headLength *
                        Math.cos(
                            angle +
                                Math.PI / 6
                        ),

                end.y -
                    headLength *
                        Math.sin(
                            angle +
                                Math.PI / 6
                        )
            );

            ctx.stroke();
        }
    };

    // =========================================================
    // MOUSE DOWN
    // =========================================================

    const handlePointerDown = (event) => {
        if (disabled) return;

        const point = getPosition(event);

        // TEXT
        if (tool === "text") {
            const rect =
                canvasRef.current.getBoundingClientRect();

            setTextInput({
                x:
                    event.clientX -
                    rect.left,

                y:
                    event.clientY -
                    rect.top,
            });

            setTextValue("");

            return;
        }

        saveHistory();

        setIsDrawing(true);

        setStartPoint(point);

        setCurrentPoint(point);

        const canvas = canvasRef.current;

        const ctx = canvas.getContext("2d");

        if (
            tool === "pen" ||
            tool === "eraser"
        ) {
            ctx.beginPath();

            ctx.moveTo(
                point.x,
                point.y
            );
        }

        canvas.setPointerCapture(
            event.pointerId
        );
    };

    // =========================================================
    // POINTER MOVE
    // =========================================================

    const handlePointerMove = (event) => {
        if (!isDrawing || disabled) return;

        const point = getPosition(event);

        const canvas = canvasRef.current;

        const ctx = canvas.getContext("2d");

        if (
            tool === "pen"
        ) {
            drawPen(point);
        }

        if (
            tool === "eraser"
        ) {
            drawEraser(point);
        }

        if (
            [
                "rectangle",
                "circle",
                "line",
                "arrow",
            ].includes(tool)
        ) {
            // Restore last state
            // and draw preview.

            const previousHistory =
                history[history.length - 1];

            if (previousHistory) {
                const image =
                    new Image();

                image.onload = () => {
                    ctx.clearRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    ctx.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    drawShape(
                        ctx,
                        tool,
                        startPoint,
                        point
                    );
                };

                image.src =
                    previousHistory;
            } else {
                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.fillStyle =
                    "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                drawShape(
                    ctx,
                    tool,
                    startPoint,
                    point
                );
            }
        }

        setCurrentPoint(point);
    };

    // =========================================================
    // POINTER UP
    // =========================================================

    const handlePointerUp = () => {
        if (!isDrawing) return;

        setIsDrawing(false);

        const canvas = canvasRef.current;

        const ctx = canvas.getContext("2d");

        // Finalize shapes
        if (
            startPoint &&
            currentPoint &&
            [
                "rectangle",
                "circle",
                "line",
                "arrow",
            ].includes(tool)
        ) {
            const previousHistory =
                history[history.length - 1];

            if (previousHistory) {
                const image =
                    new Image();

                image.onload = () => {
                    ctx.clearRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    ctx.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    drawShape(
                        ctx,
                        tool,
                        startPoint,
                        currentPoint
                    );

                    updateParent();
                };

                image.src =
                    previousHistory;
            } else {
                drawShape(
                    ctx,
                    tool,
                    startPoint,
                    currentPoint
                );

                updateParent();
            }
        } else {
            updateParent();
        }

        setStartPoint(null);
        setCurrentPoint(null);
    };

    // =========================================================
    // ADD TEXT
    // =========================================================

    const addText = () => {
        if (!textValue.trim()) {
            setTextInput(null);
            return;
        }

        const canvas = canvasRef.current;

        const ctx = canvas.getContext("2d");

        saveHistory();

        // Convert screen position to canvas position
        const rect =
            canvas.getBoundingClientRect();

        const x =
            ((textInput.x +
                rect.left -
                rect.left) /
                rect.width) *
            canvas.width;

        const y =
            ((textInput.y +
                rect.top -
                rect.top) /
                rect.height) *
            canvas.height;

        ctx.fillStyle = "#111827";

        ctx.font = `${textSize}px Arial`;

        ctx.textBaseline = "top";

        // Support multiple lines
        const lines =
            textValue.split("\n");

        lines.forEach(
            (line, index) => {
                ctx.fillText(
                    line,
                    x,
                    y +
                        index *
                            (textSize + 6)
                );
            }
        );

        updateParent();

        setTextInput(null);
        setTextValue("");
    };

    // =========================================================
    // UNDO
    // =========================================================

    const handleUndo = () => {
        if (disabled) return;

        if (history.length === 0) {
            return;
        }

        const previous =
            history[history.length - 1];

        const image =
            new Image();

        image.onload = () => {
            const canvas =
                canvasRef.current;

            const ctx =
                canvas.getContext("2d");

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

            setHistory((items) =>
                items.slice(
                    0,
                    -1
                )
            );

            setTimeout(() => {
                updateParent();
            }, 0);
        };

        image.src = previous;
    };

    // =========================================================
    // CLEAR
    // =========================================================

    const handleClear = () => {
        if (disabled) return;

        saveHistory();

        const canvas =
            canvasRef.current;

        const ctx =
            canvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        updateParent();
    };

    // =========================================================
    // TOOL BUTTON
    // =========================================================

    const ToolButton = ({
        id,
        icon,
        label,
    }) => (
        <button
            type="button"
            onClick={() => setTool(id)}
            disabled={disabled}
            title={label}
            className={`
                flex items-center justify-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                font-medium
                transition
                ${
                    tool === id
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-purple-50"
                }
                disabled:opacity-50
                disabled:cursor-not-allowed
            `}
        >
            {icon}
            <span className="hidden sm:inline">
                {label}
            </span>
        </button>
    );

    return (
        <div
            ref={containerRef}
            className="w-full"
        >
            {/* =================================================
                TITLE
            ================================================= */}

            <div className="mb-3">
                <h3 className="text-base font-bold text-gray-900">
                    Draw / Write Figure
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                    Draw diagrams, add shapes, or type
                    text using the tools below.
                </p>
            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="bg-gray-50 border border-gray-200 rounded-t-2xl p-3">
                <div className="flex flex-wrap items-center gap-2">

                    {/* PEN */}

                    <ToolButton
                        id="pen"
                        label="Pen"
                        icon={
                            <Pencil
                                size={18}
                            />
                        }
                    />

                    {/* TEXT */}

                    <ToolButton
                        id="text"
                        label="Text"
                        icon={
                            <Type
                                size={18}
                            />
                        }
                    />

                    {/* RECTANGLE */}

                    <ToolButton
                        id="rectangle"
                        label="Rectangle"
                        icon={
                            <Square
                                size={18}
                            />
                        }
                    />

                    {/* CIRCLE */}

                    <ToolButton
                        id="circle"
                        label="Circle"
                        icon={
                            <Circle
                                size={18}
                            />
                        }
                    />

                    {/* LINE */}

                    <ToolButton
                        id="line"
                        label="Line"
                        icon={
                            <Minus
                                size={18}
                            />
                        }
                    />

                    {/* ARROW */}

                    <ToolButton
                        id="arrow"
                        label="Arrow"
                        icon={
                            <ArrowUpRight
                                size={18}
                            />
                        }
                    />

                    {/* ERASER */}

                    <ToolButton
                        id="eraser"
                        label="Eraser"
                        icon={
                            <Eraser
                                size={18}
                            />
                        }
                    />

                    {/* DIVIDER */}

                    <div className="hidden md:block h-8 w-px bg-gray-300 mx-1" />

                    {/* BRUSH SIZE */}

                    {(tool === "pen" ||
                        tool === "eraser" ||
                        [
                            "rectangle",
                            "circle",
                            "line",
                            "arrow",
                        ].includes(tool)) && (
                        <select
                            value={brushSize}
                            onChange={(e) =>
                                setBrushSize(
                                    Number(
                                        e.target
                                            .value
                                    )
                                )
                            }
                            disabled={
                                disabled
                            }
                            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-200"
                        >
                            <option value={2}>
                                Thin
                            </option>

                            <option value={3}>
                                Normal
                            </option>

                            <option value={5}>
                                Thick
                            </option>

                            <option value={8}>
                                Very Thick
                            </option>
                        </select>
                    )}

                    {/* TEXT SIZE */}

                    {tool === "text" && (
                        <select
                            value={textSize}
                            onChange={(e) =>
                                setTextSize(
                                    Number(
                                        e.target
                                            .value
                                    )
                                )
                            }
                            disabled={
                                disabled
                            }
                            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-200"
                        >
                            <option value={16}>
                                Small Text
                            </option>

                            <option value={22}>
                                Normal Text
                            </option>

                            <option value={28}>
                                Large Text
                            </option>

                            <option value={36}>
                                Heading
                            </option>
                        </select>
                    )}

                    <div className="flex-1" />

                    {/* UNDO */}

                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={
                            disabled ||
                            history.length ===
                                0
                        }
                        title="Undo"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Undo2
                            size={18}
                        />

                        <span className="hidden sm:inline">
                            Undo
                        </span>
                    </button>

                    {/* CLEAR */}

                    <button
                        type="button"
                        onClick={
                            handleClear
                        }
                        disabled={
                            disabled
                        }
                        title="Clear"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Trash2
                            size={18}
                        />

                        <span className="hidden sm:inline">
                            Clear
                        </span>
                    </button>
                </div>
            </div>

            {/* =================================================
                CANVAS
            ================================================= */}

            <div className="relative border-x border-b border-gray-200 rounded-b-2xl overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto block touch-none bg-white"
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerMove={
                        handlePointerMove
                    }
                    onPointerUp={
                        handlePointerUp
                    }
                    onPointerCancel={
                        handlePointerUp
                    }
                    onPointerLeave={
                        handlePointerUp
                    }
                />

                {/* =================================================
                    TEXT INPUT
                ================================================= */}

                {textInput && (
                    <div
                        className="absolute z-20"
                        style={{
                            left:
                                textInput.x,
                            top:
                                textInput.y,
                        }}
                    >
                        <div className="bg-white border-2 border-purple-400 rounded-xl shadow-xl p-2">
                            <textarea
                                autoFocus
                                value={
                                    textValue
                                }
                                onChange={(
                                    e
                                ) =>
                                    setTextValue(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    e
                                ) => {
                                    if (
                                        e.key ===
                                            "Enter" &&
                                        !e.shiftKey
                                    ) {
                                        e.preventDefault();

                                        addText();
                                    }

                                    if (
                                        e.key ===
                                        "Escape"
                                    ) {
                                        setTextInput(
                                            null
                                        );

                                        setTextValue(
                                            ""
                                        );
                                    }
                                }}
                                placeholder="Type here..."
                                rows={3}
                                className="w-64 resize-none border border-gray-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-purple-500"
                            />

                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextInput(
                                            null
                                        );

                                        setTextValue(
                                            ""
                                        );
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        addText
                                    }
                                    className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700"
                                >
                                    Add Text
                                </button>
                            </div>

                            <p className="text-[11px] text-gray-400 mt-1">
                                Enter = add text •
                                Shift+Enter = new
                                line
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* =================================================
                HELP
            ================================================= */}

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>
                    ✏️ Pen for freehand drawing
                </span>

                <span>
                    📝 Text for clear writing
                </span>

                <span>
                    ◯ Shapes for diagrams
                </span>

                <span>
                    ↩️ Undo mistakes
                </span>
            </div>
        </div>
    );
};

export default AnswerDrawingPad;