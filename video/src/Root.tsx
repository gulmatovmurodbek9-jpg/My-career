import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { Tutorial, TutorialProps, timeline, FPS } from "./Tutorial";

const calculateMetadata: CalculateMetadataFunction<TutorialProps> = ({ props }) => ({
    durationInFrames: timeline(props.manifest).total,
});

const SAMPLE: TutorialProps = {
    manifest: { id: "00", lang: "tj", title: "Намуна", next: null, scenes: [] },
};

export const Root: React.FC = () => (
    <Composition
        id="Tutorial"
        component={Tutorial}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={300}
        defaultProps={SAMPLE}
        calculateMetadata={calculateMetadata}
    />
);
