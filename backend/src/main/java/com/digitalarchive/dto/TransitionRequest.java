package com.digitalarchive.dto;

import lombok.Data;

@Data
public class TransitionRequest {
    private String comment; // required on rejection, optional otherwise
}